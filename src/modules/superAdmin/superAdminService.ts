import createError from 'http-errors';

import prisma from '../../configs/prismaConfig';
import {
  generateOtpCode,
  getOtpExpiryDate,
  hashOtpCode,
  hashPassword,
} from '../auth/authSecurity';
import { sendSchoolAdminOnboardingEmail } from '../../utils/email';

interface CreateTenantPayload {
  schoolName: string;
  schoolId: string;
  email: string;
  school: string;
  address: string;
  postalCode: string;
}

interface CreateSchoolAdminPayload {
  fullName: string;
  schoolId: string;
  email: string;
  school: string;
  password: string;
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

const generateAdminId = (firstName: string, schoolId: string): string => {
  // e.g. "UPH", "J", "4823" -> "UPH-J-4823"
  const prefix = schoolId.toUpperCase();
  const initial = firstName.charAt(0).toUpperCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();

  return `${prefix}-${initial}-${randomDigits}`;
};

export const createTenant = async (payload: CreateTenantPayload) => {
  const existingTenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ schoolId: payload.schoolId }, { email: payload.email }],
    },
  });

  if (existingTenant) {
    throw createError(
      409,
      'Tenant with the provided school ID or email already exists.',
    );
  }

  const tenant = await prisma.tenant.create({
    data: {
      schoolName: payload.schoolName,
      schoolId: payload.schoolId,
      email: payload.email,
      school: payload.school,
      address: payload.address,
      postalCode: payload.postalCode,
      isActive: true,
    },
    select: {
      schoolName: true,
      schoolId: true,
      email: true,
      school: true,
      address: true,
      postalCode: true,
      isActive: true,
    },
  });

  return {
    message: 'Tenant created successfully.',
    tenant,
  };
};

export const createSchoolAdmin = async (payload: CreateSchoolAdminPayload) => {
  const tenant = await prisma.tenant.findUnique({
    where: { schoolId: payload.schoolId },
  });

  if (!tenant) {
    throw createError(404, 'Tenant not found for the provided schoolId.');
  }

  if (tenant.school !== payload.school) {
    throw createError(
      400,
      'School does not match the tenant record for this schoolId.',
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  const otpCode = generateOtpCode();
  const passwordHash = await hashPassword(payload.password);
  const { firstName, lastName } = splitFullName(payload.fullName);

  // Generate the new unique Admin ID safely mapped against the current school
  const adminId = generateAdminId(firstName, payload.schoolId);

  const user =
    existingUser &&
    existingUser.role === 'SCHOOL_ADMIN' &&
    existingUser.approvalStatus === 'REJECTED'
      ? await prisma.user.update({
          where: { email: payload.email },
          data: {
            firstName,
            lastName,
            passwordHash,
            role: 'SCHOOL_ADMIN',
            adminId,
            school: payload.school,
            schoolId: payload.schoolId,
            tenantId: tenant.id,
            isVerified: false,
            approvalStatus: 'PENDING',
            approvalRemark: null,
            emailOtpHash: hashOtpCode(otpCode),
            emailOtpExpiresAt: getOtpExpiryDate(),
          },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            adminId: true,
            role: true,
            school: true,
            schoolId: true,
            isVerified: true,
            approvalStatus: true,
          },
        })
      : existingUser
        ? (() => {
            throw createError(409, 'A user with this email already exists.');
          })()
        : await prisma.user.create({
            data: {
              firstName,
              lastName,
              email: payload.email,
              passwordHash,
              role: 'SCHOOL_ADMIN',
              adminId,
              school: payload.school,
              schoolId: payload.schoolId,
              tenantId: tenant.id,
              isVerified: false,
              approvalStatus: 'PENDING',
              emailOtpHash: hashOtpCode(otpCode),
              emailOtpExpiresAt: getOtpExpiryDate(),
            },
            select: {
              firstName: true,
              lastName: true,
              email: true,
              adminId: true,
              role: true,
              school: true,
              schoolId: true,
              isVerified: true,
              approvalStatus: true,
            },
          });

  await sendSchoolAdminOnboardingEmail({
    name: payload.fullName,
    email: payload.email,
    password: payload.password,
    adminId,
    schoolId: payload.schoolId,
    school: payload.school,
    otpCode,
  });

  return {
    message:
      'School admin account submitted successfully. OTP and login details have been sent by email. Await super admin verification.',
    user,
  };
};

export const verifySchoolAdmin = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== 'SCHOOL_ADMIN') {
    throw createError(404, 'School admin account not found.');
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
      isVerified: true,
      approvalStatus: true,
    },
  });

  return {
    message: 'School admin account verified successfully.',
    user: updatedUser,
  };
};

export const rejectSchoolAdmin = async (userId: string, remark?: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== 'SCHOOL_ADMIN') {
    throw createError(404, 'School admin account not found.');
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
      isVerified: true,
      approvalStatus: true,
      approvalRemark: true,
    },
  });

  return {
    message: 'School admin account rejected.',
    user: updatedUser,
  };
};
