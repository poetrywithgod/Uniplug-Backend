import createError from 'http-errors';

import prisma from '../../configs/prismaConfig';
import {
  hashOtpCode,
  hashPassword,
  generateOtpCode,
  getOtpExpiryDate,
} from '../auth/authSecurity';
import { sendStaffOnboardingEmail } from '../../utils/email';

interface CreateStaffPayload {
  fullName: string;
  staffId: string;
  email: string;
  department: string;
  password: string;
}

interface ActorContext {
  id: string;
  tenantId?: string | null;
  schoolId?: string | null;
  school?: string | null;
}

const splitFullName = (
  fullName: string,
): { firstName: string; lastName: string } => {
  const cleaned = fullName.trim().replace(/\s+/g, ' ');
  const [firstName, ...rest] = cleaned.split(' ');
  return {
    firstName,
    lastName: rest.join(' ') || firstName,
  };
};

const createStaffAccount = async (
  payload: CreateStaffPayload,
  role: 'LECTURER' | 'HOSTEL_ADMIN',
  actor: ActorContext,
) => {
  if (!actor.tenantId || !actor.schoolId || !actor.school) {
    throw createError(400, 'School admin account is not linked to a tenant.');
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: actor.tenantId } });

  if (!tenant) {
    throw createError(404, 'Tenant not found for current school admin.');
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  const canResubmitRejected =
    !!existingByEmail &&
    existingByEmail.role === role &&
    existingByEmail.approvalStatus === 'REJECTED' &&
    existingByEmail.tenantId === actor.tenantId;

  if (existingByEmail && !canResubmitRejected) {
    throw createError(409, 'A user with this email already exists.');
  }

  const existingByStaffId = await prisma.user.findFirst({
    where: { staffId: payload.staffId },
  });

  if (existingByStaffId && existingByStaffId.email !== payload.email) {
    throw createError(409, 'A user with this staff ID already exists.');
  }

  const { firstName, lastName } = splitFullName(payload.fullName);
  const passwordHash = await hashPassword(payload.password);
  const otpCode = generateOtpCode();

  const user = canResubmitRejected
    ? await prisma.user.update({
        where: { email: payload.email },
        data: {
          firstName,
          lastName,
          passwordHash,
          staffId: payload.staffId,
          department: payload.department,
          role,
          schoolId: actor.schoolId,
          school: actor.school,
          tenantId: actor.tenantId,
          approvalStatus: 'PENDING',
          approvalRemark: null,
          isVerified: false,
          emailOtpHash: hashOtpCode(otpCode),
          emailOtpExpiresAt: getOtpExpiryDate(),
        },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          schoolId: true,
          school: true,
          staffId: true,
          department: true,
          isVerified: true,
          approvalStatus: true,
        },
      })
    : await prisma.user.create({
        data: {
          firstName,
          lastName,
          email: payload.email,
          phoneNumber: null,
          staffId: payload.staffId,
          department: payload.department,
          schoolId: actor.schoolId,
          school: actor.school,
          tenantId: actor.tenantId,
          passwordHash,
          role,
          isVerified: false,
          approvalStatus: 'PENDING',
          emailOtpHash: hashOtpCode(otpCode),
          emailOtpExpiresAt: getOtpExpiryDate(),
        },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          schoolId: true,
          school: true,
          staffId: true,
          department: true,
          isVerified: true,
          approvalStatus: true,
        },
      });

  await sendStaffOnboardingEmail({
    name: payload.fullName,
    email: payload.email,
    password: payload.password,
    role,
    schoolId: tenant.schoolId,
    school: tenant.school,
    staffId: payload.staffId,
    department: payload.department,
    otpCode,
  });

  return {
    message: `${role === 'LECTURER' ? 'Lecturer' : 'Hostel admin'} account submitted successfully. OTP and login details sent by email. Await school admin verification.`,
    user,
  };
};

export const createLecturer = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'LECTURER', actor);
};

export const createHostelAdmin = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'HOSTEL_ADMIN', actor);
};

export const verifyStaffAccount = async (userId: string, actor: ActorContext) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || (user.role !== 'LECTURER' && user.role !== 'HOSTEL_ADMIN')) {
    throw createError(404, 'Staff account not found.');
  }

  if (!actor.tenantId || user.tenantId !== actor.tenantId) {
    throw createError(403, 'You can only verify staff within your tenant.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      approvalStatus: 'VERIFIED',
      approvalRemark: null,
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      school: true,
      schoolId: true,
      approvalStatus: true,
      isVerified: true,
    },
  });

  return {
    message: 'Staff account verified successfully.',
    user: updatedUser,
  };
};

export const rejectStaffAccount = async (
  userId: string,
  actor: ActorContext,
  remark?: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || (user.role !== 'LECTURER' && user.role !== 'HOSTEL_ADMIN')) {
    throw createError(404, 'Staff account not found.');
  }

  if (!actor.tenantId || user.tenantId !== actor.tenantId) {
    throw createError(403, 'You can only reject staff within your tenant.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      approvalStatus: 'REJECTED',
      approvalRemark: remark?.trim() || null,
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      school: true,
      schoolId: true,
      approvalStatus: true,
      approvalRemark: true,
      isVerified: true,
    },
  });

  return {
    message: 'Staff account rejected.',
    user: updatedUser,
  };
};
