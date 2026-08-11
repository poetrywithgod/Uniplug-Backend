import createError from 'http-errors';

import prisma from '../../configs/prismaConfig';
import { FRONTEND_URL } from '../../configs/envConfig';
import {
  sendOtpEmail,
  resendOtpEmail,
  sendPasswordResetEmail,
} from '../../utils/email';
import {
  comparePassword,
  generateOtpCode,
  getOtpExpiryDate,
  generateResetToken,
  getResetTokenExpiryDate,
  hashOtpCode,
  hashResetToken,
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

export const buildRichUserProfile = async (userId: string): Promise<PublicUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        include: {
          faculty: true,
        },
      },
      programmeEnrollments: {
        where: { isActive: true },
        include: {
          programme: {
            include: {
              department: {
                include: {
                  faculty: true,
                },
              },
            },
          },
          startSession: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) {
    throw createError(404, 'User not found.');
  }

  let activeSession: { id: string; name: string } | null = null;
  let activeSemester: { id: string; name: string } | null = null;

  if (user.tenantId) {
    const session = await prisma.academicSession.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, name: true },
    });

    if (session) {
      activeSession = session;
      const semester = await prisma.academicSemester.findFirst({
        where: { sessionId: session.id, isActive: true },
        select: { id: true, name: true },
      });
      if (semester) {
        activeSemester = semester;
      }
    }
  }

  const activeEnrollment = user.programmeEnrollments?.[0] || null;

  let resolvedDepartment: { id: string; name: string } | null = null;
  if (user.department) {
    resolvedDepartment = {
      id: user.department.id,
      name: user.department.name,
    };
  } else if (activeEnrollment?.programme?.department) {
    resolvedDepartment = {
      id: activeEnrollment.programme.department.id,
      name: activeEnrollment.programme.department.name,
    };
  }

  let resolvedFaculty: { id: string; name: string; code?: string } | null = null;
  if (user.department?.faculty) {
    resolvedFaculty = {
      id: user.department.faculty.id,
      name: user.department.faculty.name,
      code: user.department.faculty.code,
    };
  } else if (activeEnrollment?.programme?.department?.faculty) {
    resolvedFaculty = {
      id: activeEnrollment.programme.department.faculty.id,
      name: activeEnrollment.programme.department.faculty.name,
      code: activeEnrollment.programme.department.faculty.code,
    };
  }

  // Base profile common to all users
  const baseProfile = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isVerified: user.isVerified,
  };

  // 1. STUDENT Role Profile: Include matricNumber, level, programme, session, semester; exclude staffId & adminId
  if (user.role === Role.STUDENT) {
    return {
      ...baseProfile,
      matricNumber: user.staffId || user.adminId || null,
      level: user.level ?? null,
      school: user.school,
      schoolId: user.schoolId,
      tenantId: user.tenantId,
      department: resolvedDepartment,
      faculty: resolvedFaculty,
      programmeEnrollment: activeEnrollment
        ? {
            id: activeEnrollment.id,
            programmeId: activeEnrollment.programmeId,
            programmeName: activeEnrollment.programme.name,
            programmeCode: activeEnrollment.programme.code,
            entryLevel: activeEnrollment.entryLevel,
            currentLevel: activeEnrollment.currentLevel,
            admissionPathway: activeEnrollment.admissionPathway,
            status: activeEnrollment.status,
            isActive: activeEnrollment.isActive,
            startSession: activeEnrollment.startSession
              ? {
                  id: activeEnrollment.startSession.id,
                  name: activeEnrollment.startSession.name,
                }
              : null,
          }
        : null,
      activeSession,
      activeSemester,
    };
  }

  // 2. STAFF Roles: Include staffId, adminId, approvalStatus; exclude matricNumber, level & programmeEnrollment
  const staffRoles: Role[] = [
    Role.LECTURER,
    Role.HOD,
    Role.SCHOOL_ADMIN,
    Role.ADMISSION_OFFICER,
    Role.EXAMINATION_OFFICER,
    Role.FINANCE_OFFICER,
    Role.HOSTEL_MANAGER,
    Role.HOSTEL_STAFF,
  ];
  const isStaffRole = staffRoles.includes(user.role);

  if (isStaffRole) {
    const staffProfile: Record<string, any> = {
      ...baseProfile,
      staffId: user.staffId || (user.role === Role.SCHOOL_ADMIN ? user.adminId : null),
      approvalStatus: user.approvalStatus,
      school: user.school,
      schoolId: user.schoolId,
      tenantId: user.tenantId,
      department: resolvedDepartment,
      faculty: resolvedFaculty,
      activeSession,
      activeSemester,
    };
    if (user.role === Role.SCHOOL_ADMIN && user.adminId) {
      staffProfile.adminId = user.adminId;
    }
    return staffProfile as PublicUser;
  }

  // 3. APPLICANT Role Profile: Exclude matricNumber, staffId, adminId, level, programme
  if (user.role === Role.APPLICANT) {
    return {
      ...baseProfile,
      school: user.school,
      schoolId: user.schoolId,
      tenantId: user.tenantId,
    };
  }

  // 4. Other Roles (PARENT, SUPER_ADMIN)
  return {
    ...baseProfile,
    school: user.school,
    schoolId: user.schoolId,
    tenantId: user.tenantId,
  };
};

/**
 * Get current authenticated user profile with full student & academic context.
 */
export const getCurrentUser = async (userId: string) => {
  const user = await buildRichUserProfile(userId);
  return {
    message: 'User profile retrieved successfully.',
    user,
  };
};

/**
 * Register a new applicant or parent account.
 * Generates an email OTP verification code and registers password credentials.
 */
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
          role,
          isVerified: false,
          credential: {
            upsert: {
              create: {
                passwordHash,
                emailOtpHash,
                emailOtpExpiresAt,
              },
              update: {
                passwordHash,
                emailOtpHash,
                emailOtpExpiresAt,
              },
            },
          },
        },
      })
    : await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phoneNumber,
          role,
          isVerified: false,
          credential: {
            create: {
              passwordHash,
              emailOtpHash,
              emailOtpExpiresAt,
            },
          },
        },
      });

  await sendOtpEmail(firstName, email, otpCode);

  const richUser = await buildRichUserProfile(user.id);

  return {
    message:
      'Registration successful. Check your email for OTP verification code.',
    user: richUser,
  };
};

/**
 * Verify the OTP sent to the user's email during registration.
 * Marks the account as verified and issues a JWT access token.
 */
export const verifyRegistrationOtp = async (payload: VerifyOtpBody) => {
  const email = normalizeEmail(payload.email);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { credential: true },
  });

  if (!user) {
    throw createError(404, 'User not found.');
  }

  if (user.isVerified) {
    const token = signAccessToken({
      sub: user.id,
      role: user.role,
    });

    const richUser = await buildRichUserProfile(user.id);

    return {
      message: 'Account is already verified.',
      token,
      user: richUser,
    };
  }

  if (!user.credential?.emailOtpHash || !user.credential?.emailOtpExpiresAt) {
    throw createError(400, 'No active OTP found. Please request a new code.');
  }

  const otpHash = hashOtpCode(payload.otpCode);
  const isExpired = user.credential.emailOtpExpiresAt.getTime() < Date.now();

  if (isExpired || otpHash !== user.credential.emailOtpHash) {
    throw createError(400, 'Invalid or expired OTP code.');
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      credential: {
        update: {
          emailOtpHash: null,
          emailOtpExpiresAt: null,
        },
      },
    },
  });

  const token = signAccessToken({
    sub: updatedUser.id,
    role: updatedUser.role,
  });

  const richUser = await buildRichUserProfile(updatedUser.id);

  return {
    message: 'Account verified successfully.',
    token,
    user: richUser,
  };
};

/**
 * Re-generate and re-send the registration OTP verification code to the user's email.
 */
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
      credential: {
        update: {
          emailOtpHash: hashOtpCode(otpCode),
          emailOtpExpiresAt: getOtpExpiryDate(),
        },
      },
    },
  });

  await resendOtpEmail(user.firstName, user.email, otpCode);

  return {
    message: 'A new OTP code has been sent to your email.',
  };
};

/**
 * Validate credentials (email or Admin ID) and log in a user.
 * Generates and returns a JWT access token for verified and approved accounts.
 */
export const loginUser = async (payload: LoginBody) => {
  const identifier = normalizeEmail(payload.email);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { adminId: payload.email }, // Using original payload.email in case normalizeEmail mutates ID layout
      ],
    },
    include: { credential: true },
  });

  if (!user || !user.credential) {
    throw createError(401, 'Invalid email or password.');
  }

  const isPasswordValid = await comparePassword(
    payload.password,
    user.credential.passwordHash,
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
    Role.HOSTEL_MANAGER,
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

  const richUser = await buildRichUserProfile(user.id);

  return {
    message: 'Login successful.',
    token,
    user: richUser,
  };
};

/**
 * Initiate password recovery by generating a reset token and emailing a recovery link.
 */
export const forgotPassword = async (payload: ForgotPasswordBody) => {
  const email = normalizeEmail(payload.email);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  const resetToken = generateResetToken();
  const resetTokenHash = hashResetToken(resetToken);

  const baseUrl = FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(
    resetToken,
  )}`;

  await prisma.user.update({
    where: { email },
    data: {
      credential: {
        update: {
          resetTokenHash,
          resetTokenExpiresAt: getResetTokenExpiryDate(),
        },
      },
    },
  });

  await sendPasswordResetEmail(user.firstName, email, resetLink);

  return {
    message:
      'If an account exists with this email, a password reset link has been sent.',
  };
};

/**
 * Verify a reset token and update the user's password credentials.
 */
export const resetPassword = async (payload: ResetPasswordBody) => {
  const tokenHash = hashResetToken(payload.token);

  const user = await prisma.user.findFirst({
    where: {
      credential: {
        resetTokenHash: tokenHash,
      },
    },
    include: { credential: true },
  });

  if (!user || !user.credential || !user.credential.resetTokenExpiresAt) {
    throw createError(400, 'Invalid or expired reset link.');
  }

  const isExpired = user.credential.resetTokenExpiresAt.getTime() < Date.now();

  if (isExpired) {
    throw createError(400, 'Invalid or expired reset link.');
  }

  const passwordHash = await hashPassword(payload.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      credential: {
        update: {
          passwordHash,
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      },
    },
  });

  return {
    message:
      'Password reset successful. You can now log in with your new password.',
  };
};

