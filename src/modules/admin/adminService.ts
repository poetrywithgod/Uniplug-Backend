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
) => {
  const existingByEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingByEmail) {
    throw createError(409, 'A user with this email already exists.');
  }

  const existingByStaffId = await prisma.user.findFirst({
    where: { staffId: payload.staffId },
  });

  if (existingByStaffId) {
    throw createError(409, 'A user with this staff ID already exists.');
  }

  const { firstName, lastName } = splitFullName(payload.fullName);
  const passwordHash = await hashPassword(payload.password);
  const otpCode = generateOtpCode();

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email: payload.email,
      phoneNumber: null,
      staffId: payload.staffId,
      department: payload.department,
      passwordHash,
      role,
      isVerified: false,
      emailOtpHash: hashOtpCode(otpCode),
      emailOtpExpiresAt: getOtpExpiryDate(),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      staffId: true,
      department: true,
      isVerified: true,
      createdAt: true,
    },
  });

  await sendStaffOnboardingEmail({
    name: payload.fullName,
    email: payload.email,
    password: payload.password,
    role,
    staffId: payload.staffId,
    department: payload.department,
    otpCode,
  });

  return {
    message: `${role === 'LECTURER' ? 'Lecturer' : 'Hostel admin'} account created and login details sent by email.`,
    user,
  };
};

export const createLecturer = async (payload: CreateStaffPayload) => {
  return createStaffAccount(payload, 'LECTURER');
};

export const createHostelAdmin = async (payload: CreateStaffPayload) => {
  return createStaffAccount(payload, 'HOSTEL_ADMIN');
};
