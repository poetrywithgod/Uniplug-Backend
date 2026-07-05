import createError from 'http-errors';

import prisma from '../../configs/prismaConfig';
import {
  hashOtpCode,
  hashPassword,
  generateOtpCode,
  getOtpExpiryDate,
} from '../auth/authSecurity';
import { sendStaffOnboardingEmail } from '../../utils/email';
import { generateAdminId } from '../../utils/helpers';

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
  role:
    | 'LECTURER'
    | 'HOSTEL_MANAGER'
    | 'HOD'
    | 'ADMISSION_OFFICER'
    | 'EXAMINATION_OFFICER'
    | 'FINANCE_OFFICER'
    | 'HOSTEL_STAFF',
  actor: ActorContext,
) => {
  if (!actor.tenantId || !actor.schoolId || !actor.school) {
    throw createError(400, 'School admin account is not linked to a tenant.');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: actor.tenantId },
  });

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
  const adminId = generateAdminId(firstName, actor.schoolId);

  const user = canResubmitRejected
    ? await prisma.user.update({
        where: { email: payload.email },
        data: {
          firstName,
          lastName,
          adminId,
          staffId: payload.staffId,
          department: payload.department,
          role,
          schoolId: actor.schoolId,
          school: actor.school,
          tenantId: actor.tenantId,
          approvalStatus: 'VERIFIED',
          approvalRemark: null,
          isVerified: false,
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
          role: true,
          schoolId: true,
          school: true,
          adminId: true,
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
          adminId,
          staffId: payload.staffId,
          department: payload.department,
          schoolId: actor.schoolId,
          school: actor.school,
          tenantId: actor.tenantId,
          role,
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
          role: true,
          schoolId: true,
          school: true,
          adminId: true,
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
    adminId,
    schoolId: tenant.schoolId,
    school: tenant.school,
    staffId: payload.staffId,
    department: payload.department,
    otpCode,
  });

  return {
    message: `${role.replace('_', ' ').toLowerCase()} account created and approved successfully. OTP and login details sent by email.`,
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
  return createStaffAccount(payload, 'HOSTEL_MANAGER', actor);
};

export const createHOD = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'HOD', actor);
};

export const createAdmissionOfficer = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'ADMISSION_OFFICER', actor);
};

export const createExaminationOfficer = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'EXAMINATION_OFFICER', actor);
};

export const createFinanceOfficer = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'FINANCE_OFFICER', actor);
};

export const createHostelStaff = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'HOSTEL_STAFF', actor);
};


export const verifyStaffAccount = async (
  userId: string,
  actor: ActorContext,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || (user.role !== 'LECTURER' && user.role !== 'HOSTEL_MANAGER')) {
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

  if (!user || (user.role !== 'LECTURER' && user.role !== 'HOSTEL_MANAGER')) {
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

export const getApplications = async (
  query: {
    page: number;
    limit: number;
    status?: string;
    program?: string;
    session?: string;
    search?: string;
  },
  actor: ActorContext,
) => {
  if (!actor.tenantId) {
    throw createError(400, 'School admin account is not linked to a tenant.');
  }

  const { page, limit, status, program, session, search } = query;
  const skip = (page - 1) * limit;

  // Build the where clause dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { schoolId: actor.tenantId }; // querying the tenantId representing the school
  const trimmedSearch = search?.trim();

  if (status) {
    where.status = status;
  }
  if (session) {
    where.session = session;
  }
  if (program) {
    // Handling nested json querying in Prisma for Mongodb
    where.programmeSelection = {
      is: {
        course: program,
      },
    };
  }
  if (trimmedSearch) {
    where.OR = [
      {
        applicationNumber: {
          contains: trimmedSearch,
          mode: 'insensitive',
        },
      },
      {
        applicant: {
          firstName: { contains: trimmedSearch, mode: 'insensitive' },
        },
      },
      {
        applicant: {
          lastName: { contains: trimmedSearch, mode: 'insensitive' },
        },
      },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        applicationNumber: true,
        status: true,
        session: true,
        rejectionReason: true,
        progressPercentage: true,
        createdAt: true,
        personalDetails: true,
        academicHistory: true,
        documents: true,
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        school: {
          select: {
            id: true,
            schoolName: true,
            schoolId: true,
          },
        },
        programmeSelection: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.application.count({ where }),
  ]);

  return {
    data: applications,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateApplicationStatus = async (
  id: string,
  payload: {
    status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  },
  actor: ActorContext,
) => {
  if (!actor.tenantId) {
    throw createError(400, 'School admin account is not linked to a tenant.');
  }

  const application = await prisma.application.findUnique({
    where: { id },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.schoolId !== actor.tenantId) {
    throw createError(
      403,
      'You do not have permission to modify this application.',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataToUpdate: any = { status: payload.status };

  if (payload.status === 'REJECTED') {
    dataToUpdate.rejectionReason = payload.rejectionReason;
  } else if (application.status === 'REJECTED') {
    // Clear rejection reason if changing status back from rejected
    dataToUpdate.rejectionReason = null;
  }

  const updatedApplication = await prisma.application.update({
    where: { id },
    data: dataToUpdate,
  });

  if (payload.status === 'APPROVED') {
    await prisma.user.update({
      where: { id: application.applicantId },
      data: {
        role: 'STUDENT',
        tenantId: application.schoolId,
      },
    });
  }

  return {
    message: 'Application status updated successfully',
    data: updatedApplication,
  };
};

export const createSession = async (
  payload: { name: string; isActive?: boolean },
  actor: ActorContext,
) => {
  if (!actor.tenantId) {
    throw createError(400, 'School admin account is not linked to a tenant.');
  }

  const existing = await prisma.academicSession.findFirst({
    where: { tenantId: actor.tenantId, name: payload.name },
  });

  if (existing) {
    throw createError(409, 'Academic session with this name already exists.');
  }

  if (payload.isActive) {
    await prisma.academicSession.updateMany({
      where: { tenantId: actor.tenantId },
      data: { isActive: false },
    });
  }

  const session = await prisma.academicSession.create({
    data: {
      name: payload.name,
      isActive: !!payload.isActive,
      tenantId: actor.tenantId,
    },
  });

  return {
    message: 'Academic session created successfully.',
    session,
  };
};

export const activateSession = async (sessionId: string, actor: ActorContext) => {
  if (!actor.tenantId) {
    throw createError(400, 'School admin account is not linked to a tenant.');
  }

  const session = await prisma.academicSession.findFirst({
    where: { id: sessionId, tenantId: actor.tenantId },
  });

  if (!session) {
    throw createError(404, 'Academic session not found.');
  }

  await prisma.academicSession.updateMany({
    where: { tenantId: actor.tenantId },
    data: { isActive: false },
  });

  const updated = await prisma.academicSession.update({
    where: { id: sessionId },
    data: { isActive: true },
  });

  return {
    message: 'Academic session activated successfully.',
    session: updated,
  };
};

export const createSemester = async (
  sessionId: string,
  payload: { name: string; isActive?: boolean },
  actor: ActorContext,
) => {
  if (!actor.tenantId) {
    throw createError(400, 'School admin account is not linked to a tenant.');
  }

  const session = await prisma.academicSession.findFirst({
    where: { id: sessionId, tenantId: actor.tenantId },
  });

  if (!session) {
    throw createError(404, 'Academic session not found.');
  }

  const existing = await prisma.academicSemester.findFirst({
    where: { sessionId, name: payload.name },
  });

  if (existing) {
    throw createError(409, 'Academic semester with this name already exists under this session.');
  }

  if (payload.isActive) {
    await prisma.academicSemester.updateMany({
      where: { sessionId },
      data: { isActive: false },
    });
  }

  const semester = await prisma.academicSemester.create({
    data: {
      name: payload.name,
      isActive: !!payload.isActive,
      sessionId,
      tenantId: actor.tenantId,
    },
  });

  return {
    message: 'Academic semester created successfully.',
    semester,
  };
};

export const activateSemester = async (semesterId: string, actor: ActorContext) => {
  if (!actor.tenantId) {
    throw createError(400, 'School admin account is not linked to a tenant.');
  }

  const semester = await prisma.academicSemester.findFirst({
    where: { id: semesterId, tenantId: actor.tenantId },
  });

  if (!semester) {
    throw createError(404, 'Academic semester not found.');
  }

  await prisma.academicSemester.updateMany({
    where: { sessionId: semester.sessionId },
    data: { isActive: false },
  });

  const updated = await prisma.academicSemester.update({
    where: { id: semesterId },
    data: { isActive: true },
  });

  return {
    message: 'Academic semester activated successfully.',
    semester: updated,
  };
};

export const getSessions = async (actor: ActorContext) => {
  if (!actor.tenantId) {
    throw createError(400, 'School admin account is not linked to a tenant.');
  }

  const sessions = await prisma.academicSession.findMany({
    where: { tenantId: actor.tenantId },
    include: { semesters: true },
    orderBy: { name: 'desc' },
  });

  return {
    sessions,
  };
};

