import createError from 'http-errors';

import prisma from '../../configs/prismaConfig';
import {
  sendOtpEmail,
  resendOtpEmail,
  sendPasswordResetEmail,
} from '../../utils/email';
import {
  comparePassword,
  generateOtpCode,
  getOtpExpiryDate,
  hashOtpCode,
  hashPassword,
  signAccessToken,
} from './authSecurity';
import {
  normalizeEmail,
  normalizeName,
  normalizePhoneNumber,
} from '../../utils/sanitize';
import {
  ForgotPasswordBody,
  LoginBody,
  PublicUser,
  RegisterBody,
  ResetPasswordBody,
  ResendOtpBody,
  VerifyOtpBody,
} from '../../types/auth';
import { Role } from '../../../generated/prisma';

const roleMap: Record<RegisterBody['role'], Role> = {
  applicant: Role.APPLICANT,
  parent: Role.PARENT,
};

const toPublicUser = (user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
  isVerified: boolean;
  school?: string | null;
  schoolId?: string | null;
  approvalStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  staffId?: string | null;
  department?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  isVerified: user.isVerified,
  school: user.school,
  schoolId: user.schoolId,
  approvalStatus: user.approvalStatus,
  staffId: user.staffId,
  department: user.department,
});

export const registerUser = async (payload: RegisterBody) => {
  const firstName = normalizeName(payload.firstName);
  const lastName = normalizeName(payload.lastName);
  const email = normalizeEmail(payload.email);
  const phoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const roleInput = payload.role.toLowerCase() as RegisterBody['role'];

  if (!roleMap[roleInput]) {
    throw createError(
      400,
      'Invalid role. Only applicant or parent can register.',
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser?.isVerified) {
    throw createError(409, 'Email is already registered.');
  }

  const passwordHash = await hashPassword(payload.password);
  const otpCode = generateOtpCode();
  const emailOtpHash = hashOtpCode(otpCode);
  const emailOtpExpiresAt = getOtpExpiryDate();

  const role = roleMap[roleInput];

  const user = existingUser
    ? await prisma.user.update({
        where: { email },
        data: {
          firstName,
          lastName,
          phoneNumber,
          passwordHash,
          role,
          isVerified: false,
          emailOtpHash,
          emailOtpExpiresAt,
        },
      })
    : await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phoneNumber,
          passwordHash,
          role,
          isVerified: false,
          emailOtpHash,
          emailOtpExpiresAt,
        },
      });

  await sendOtpEmail(firstName, email, otpCode);

  return {
    message:
      'Registration successful. Check your email for OTP verification code.',
    user: toPublicUser(user),
  };
};

export const verifyRegistrationOtp = async (payload: VerifyOtpBody) => {
  const email = normalizeEmail(payload.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw createError(404, 'User not found.');
  }

  if (user.isVerified) {
    const token = signAccessToken({
      sub: user.id,
      role: user.role,
    });

    return {
      message: 'Account is already verified.',
      token,
      user: toPublicUser(user),
    };
  }

  if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
    throw createError(400, 'No active OTP found. Please request a new code.');
  }

  const otpHash = hashOtpCode(payload.otpCode);
  const isExpired = user.emailOtpExpiresAt.getTime() < Date.now();

  if (isExpired || otpHash !== user.emailOtpHash) {
    throw createError(400, 'Invalid or expired OTP code.');
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      emailOtpHash: null,
      emailOtpExpiresAt: null,
    },
  });

  const token = signAccessToken({
    sub: updatedUser.id,
    role: updatedUser.role,
  });

  return {
    message: 'Account verified successfully.',
    token,
    user: toPublicUser(updatedUser),
  };
};

export const resendRegistrationOtp = async (payload: ResendOtpBody) => {
  const email = normalizeEmail(payload.email);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw createError(404, 'User not found.');
  }

  if (user.isVerified) {
    throw createError(400, 'Account is already verified.');
  }

  const otpCode = generateOtpCode();

  await prisma.user.update({
    where: { email },
    data: {
      emailOtpHash: hashOtpCode(otpCode),
      emailOtpExpiresAt: getOtpExpiryDate(),
    },
  });

  await resendOtpEmail(user.firstName, user.email, otpCode);

  return {
    message: 'A new OTP code has been sent to your email.',
  };
};

export const loginUser = async (payload: LoginBody) => {
  const email = normalizeEmail(payload.email);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw createError(401, 'Invalid email or password.');
  }

  const isPasswordValid = await comparePassword(
    payload.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw createError(401, 'Invalid email or password.');
  }

  if (!user.isVerified) {
    throw createError(
      403,
      'Account is not verified. Verify your email OTP first.',
    );
  }

  const approvalRequiredRoles: Role[] = [
    Role.SCHOOL_ADMIN,
    Role.LECTURER,
    Role.HOSTEL_ADMIN,
  ];

  if (
    approvalRequiredRoles.includes(user.role) &&
    user.approvalStatus !== 'VERIFIED'
  ) {
    throw createError(
      403,
      'Account approval is required before login access is granted.',
    );
  }

  const token = signAccessToken({
    sub: user.id,
    role: user.role,
  });

  return {
    message: 'Login successful.',
    token,
    user: toPublicUser(user),
  };
};

export const forgotPassword = async (payload: ForgotPasswordBody) => {
  const email = normalizeEmail(payload.email);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      message:
        'If an account exists with this email, a password reset OTP has been sent.',
    };
  }

  const otpCode = generateOtpCode();

  await prisma.user.update({
    where: { email },
    data: {
      resetOtpHash: hashOtpCode(otpCode),
      resetOtpExpiresAt: getOtpExpiryDate(),
    },
  });

  await sendPasswordResetEmail(user.firstName, email, otpCode);

  return {
    message:
      'If an account exists with this email, a password reset OTP has been sent.',
  };
};

export const resetPassword = async (payload: ResetPasswordBody) => {
  const email = normalizeEmail(payload.email);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw createError(404, 'User not found.');
  }

  if (!user.resetOtpHash || !user.resetOtpExpiresAt) {
    throw createError(
      400,
      'No active reset OTP found. Please request a new code.',
    );
  }

  const otpHash = hashOtpCode(payload.otpCode);
  const isExpired = user.resetOtpExpiresAt.getTime() < Date.now();

  if (isExpired || otpHash !== user.resetOtpHash) {
    throw createError(400, 'Invalid or expired OTP code.');
  }

  const passwordHash = await hashPassword(payload.newPassword);

  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      resetOtpHash: null,
      resetOtpExpiresAt: null,
    },
  });

  return {
    message:
      'Password reset successful. You can now log in with your new password.',
  };
};
