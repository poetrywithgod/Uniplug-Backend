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
  email: string;
  school?: string;
  address: string;
  postalCode: string;
}

interface CreateSchoolAdminPayload {
  fullName: string;
  schoolId: string;
  email: string;
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

const deriveShortSchoolName = (schoolName: string): string => {
  const cleanName = schoolName.replace(/[^a-zA-Z0-9\s]/g, '');
  const words = cleanName.trim().split(/\s+/);
  
  if (words.length >= 3) {
    return words.map(w => w.charAt(0).toUpperCase()).join('');
  } else if (words.length === 2) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  } else if (words.length === 1 && words[0].length > 0) {
    return words[0];
  }
  return 'School';
};

const generateUniqueSchoolId = async (schoolName: string): Promise<string> => {
  const cleanName = schoolName.replace(/[^a-zA-Z0-9\s]/g, '');
  const words = cleanName.trim().split(/\s+/);
  let prefix = '';
  
  if (words.length >= 2) {
    prefix = words.map(w => w.charAt(0).toUpperCase()).join('');
  } else if (words.length === 1 && words[0].length > 0) {
    prefix = words[0].substring(0, 3).toUpperCase();
  } else {
    prefix = 'SCH';
  }

  if (!prefix) prefix = 'SCH';

  let attempts = 0;
  while (attempts < 100) {
    const randomDigits = Math.floor(100 + Math.random() * 900).toString();
    const schoolId = `${prefix}-${randomDigits}`;
    
    const existing = await prisma.tenant.findUnique({
      where: { schoolId },
    });
    
    if (!existing) {
      return schoolId;
    }
    attempts++;
  }
  
  return `${prefix}-${Date.now().toString().slice(-4)}`;
};

/**
 * Create a new school tenant instance.
 * Automatically derives a unique school ID and short school abbreviation if not supplied.
 */
export const createTenant = async (payload: CreateTenantPayload) => {
  const existingTenant = await prisma.tenant.findFirst({
    where: {
      email: payload.email,
    },
  });

  if (existingTenant) {
    throw createError(
      409,
      'Tenant with the provided email already exists.',
    );
  }

  const schoolId = await generateUniqueSchoolId(payload.schoolName);
  const school = payload.school || deriveShortSchoolName(payload.schoolName);

  const tenant = await prisma.tenant.create({
    data: {
      schoolName: payload.schoolName,
      schoolId,
      email: payload.email,
      school,
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

/**
 * Onboard and create the primary administrator account (SCHOOL_ADMIN) for a tenant.
 * Triggers an onboarding email containing access credentials.
 */
export const createSchoolAdmin = async (payload: CreateSchoolAdminPayload) => {
  const tenant = await prisma.tenant.findUnique({
    where: { schoolId: payload.schoolId },
  });

  if (!tenant) {
    throw createError(404, 'Tenant not found for the provided schoolId.');
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
            role: 'SCHOOL_ADMIN',
            adminId,
            school: tenant.schoolName,
            schoolId: payload.schoolId,
            tenantId: tenant.id,
            isVerified: false,
            approvalStatus: 'VERIFIED',
            approvalRemark: null,
            credential: {
              upsert: {
                create: {
                  passwordHash,
                  emailOtpHash: hashOtpCode(otpCode),
                  emailOtpExpiresAt: getOtpExpiryDate(),
                },
                update: {
                  passwordHash,
                  emailOtpHash: hashOtpCode(otpCode),
                  emailOtpExpiresAt: getOtpExpiryDate(),
                },
              },
            },
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
              role: 'SCHOOL_ADMIN',
              adminId,
              school: tenant.schoolName,
              schoolId: payload.schoolId,
              tenantId: tenant.id,
              isVerified: false,
              approvalStatus: 'VERIFIED',
              credential: {
                create: {
                  passwordHash,
                  emailOtpHash: hashOtpCode(otpCode),
                  emailOtpExpiresAt: getOtpExpiryDate(),
                },
              },
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
    school: tenant.schoolName,
    otpCode,
  });

  return {
    message:
      'School admin account created and approved successfully. OTP and login details have been sent by email.',
    user,
  };
};

/**
 * Verify and approve a School Admin account to grant them system access.
 */
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

/**
 * Reject a School Admin account, logging a rejection reason remark.
 */
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

/**
 * Fetch all registered tenants in the platform.
 */
export const getTenants = async () => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return {
    tenants,
  };
};

/**
 * Fetch all School Admins belonging to a specific tenant (queried by tenant ID or school ID).
 */
export const getSchoolAdmins = async (tenantIdentifier: string) => {
  // Support searching by Mongo ObjectId (24 chars hex) or string schoolId (e.g. UPH-009)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(tenantIdentifier);

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { id: isObjectId ? tenantIdentifier : undefined },
        { schoolId: tenantIdentifier },
      ],
    },
  });

  if (!tenant) {
    throw createError(404, 'Tenant not found for the provided identifier.');
  }

  const schoolAdmins = await prisma.user.findMany({
    where: {
      tenantId: tenant.id,
      role: 'SCHOOL_ADMIN',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      adminId: true,
      phoneNumber: true,
      role: true,
      school: true,
      schoolId: true,
      isVerified: true,
      approvalStatus: true,
      approvalRemark: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    schoolAdmins,
  };
};

/**
 * Fetch all School Admins across the entire platform.
 */
export const getAllSchoolAdmins = async () => {
  const schoolAdmins = await prisma.user.findMany({
    where: {
      role: 'SCHOOL_ADMIN',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      adminId: true,
      phoneNumber: true,
      role: true,
      school: true,
      schoolId: true,
      isVerified: true,
      approvalStatus: true,
      approvalRemark: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    schoolAdmins,
  };
};
