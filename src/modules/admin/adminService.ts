import createError from 'http-errors';

import prisma from '../../configs/prismaConfig';
import {
  hashOtpCode,
  hashPassword,
  generateOtpCode,
  getOtpExpiryDate,
} from '../auth/authSecurity';
import { sendStaffOnboardingEmail, sendOfferIssuedEmail } from '../../utils/email';

import { Semester } from '../../../generated/prisma';
import { generateAdminId, generateStaffId, generateMatricNumber } from '../../utils/helpers';


interface CreateStaffPayload {
  fullName: string;
  staffId?: string;
  email: string;
  departmentId: string;
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

  // Verify that the assigned department exists and belongs to the tenant
  const department = await prisma.department.findFirst({
    where: { id: payload.departmentId, tenantId: actor.tenantId },
  });

  if (!department) {
    throw createError(404, 'The assigned department was not found.');
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

  const resolvedStaffId = payload.staffId?.trim() || generateStaffId(role, actor.schoolId);

  const existingByStaffId = await prisma.user.findFirst({
    where: { staffId: resolvedStaffId },
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
          staffId: resolvedStaffId,
          departmentId: payload.departmentId,
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
          departmentId: true,
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
          staffId: resolvedStaffId,
          departmentId: payload.departmentId,
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
          departmentId: true,
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
    staffId: resolvedStaffId,
    department: department.name,
    otpCode,
  });

  return {
    message: `${role.replace('_', ' ').toLowerCase()} account created and approved successfully. OTP and login details sent by email.`,
    user,
  };
};

/**
 * Onboard and create a new Lecturer account under the admin's school tenant.
 */
export const createLecturer = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'LECTURER', actor);
};

/**
 * Onboard and create a new Hostel Admin (Hostel Manager) account under the admin's school tenant.
 */
export const createHostelAdmin = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'HOSTEL_MANAGER', actor);
};

/**
 * Onboard and create a new HOD (Head of Department) account under the admin's school tenant.
 */
export const createHOD = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'HOD', actor);
};

/**
 * Onboard and create a new Admission Officer account under the admin's school tenant.
 */
export const createAdmissionOfficer = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'ADMISSION_OFFICER', actor);
};

/**
 * Onboard and create a new Examination Officer account under the admin's school tenant.
 */
export const createExaminationOfficer = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'EXAMINATION_OFFICER', actor);
};

/**
 * Onboard and create a new Finance Officer account under the admin's school tenant.
 */
export const createFinanceOfficer = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'FINANCE_OFFICER', actor);
};

/**
 * Onboard and create a new Hostel Staff account under the admin's school tenant.
 */
export const createHostelStaff = async (
  payload: CreateStaffPayload,
  actor: ActorContext,
) => {
  return createStaffAccount(payload, 'HOSTEL_STAFF', actor);
};


/**
 * Verify and approve a staff member's account (applicable only to Lecturer and Hostel Manager).
 */
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

/**
 * Reject a staff member's account, logging a rejection reason remark.
 */
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

/**
 * Fetch a paginated and filterable list of student admission applications submitted to the school.
 */
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
    throw createError(400, 'User account is not linked to a tenant.');
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

/**
 * Update the admission application status (Approve/Reject/Under Review).
 * Approving an application automatically upgrades the user's role to STUDENT.
 */
export const updateApplicationStatus = async (
  id: string,
  payload: {
    status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  },
  actor: ActorContext,
) => {
  if (!actor.tenantId) {
    throw createError(400, 'User account is not linked to a tenant.');
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

  if (payload.status === 'APPROVED') {
    const activeSession = await prisma.academicSession.findFirst({
      where: { tenantId: actor.tenantId, isActive: true },
    });
    if (activeSession) {
      dataToUpdate.session = activeSession.name;
    }
  }

  const updatedApplication = await prisma.application.update({
    where: { id },
    data: dataToUpdate,
  });

  if (payload.status === 'APPROVED') {
    const studentCount = await prisma.user.count({
      where: {
        tenantId: application.schoolId,
        role: 'STUDENT',
      },
    });

    const school = await prisma.tenant.findUnique({
      where: { id: application.schoolId },
      select: { schoolId: true, schoolName: true },
    });

    const matricNumber = generateMatricNumber(
      school?.schoolId || 'SCH',
      school?.schoolName || 'School',
      application.programmeSelection?.course || 'GENERAL',
      studentCount + 1,
      application.session || undefined
    );

    const pathway = application.programmeSelection?.admissionPathway || '';
    const isDE =
      pathway.trim().toLowerCase().includes('direct') ||
      pathway.trim().toLowerCase().includes('de') ||
      pathway.trim().toLowerCase().includes('conversion') ||
      pathway.trim().toLowerCase().includes('hnd');
    const startingLevelNum = isDE ? 200 : 100;
    const startingLevelStr = `${startingLevelNum} Level`;

    await prisma.user.update({
      where: { id: application.applicantId },
      data: {
        role: 'STUDENT',
        staffId: matricNumber,
        adminId: matricNumber,
        isVerified: true,
        approvalStatus: 'VERIFIED',
        level: startingLevelNum,
        departmentId: application.programmeSelection?.departmentId || undefined,
        tenantId: application.schoolId,
      },
    });

    // Auto-create/update ProgrammeEnrollment
    let programme = await prisma.programme.findFirst({
      where: {
        tenantId: application.schoolId,
        OR: [
          { name: { contains: application.programmeSelection?.course || '', mode: 'insensitive' } },
          { departmentId: application.programmeSelection?.departmentId || undefined },
        ],
      },
    });

    let academicSession = await prisma.academicSession.findFirst({
      where: {
        tenantId: application.schoolId,
        name: application.session || undefined,
      },
    });

    if (!academicSession) {
      academicSession = await prisma.academicSession.findFirst({
        where: { tenantId: application.schoolId, isActive: true },
      });
    }

    if (programme && academicSession) {
      const existingEnrollment = await prisma.programmeEnrollment.findFirst({
        where: {
          studentId: application.applicantId,
          tenantId: application.schoolId,
        },
      });

      if (existingEnrollment) {
        await prisma.programmeEnrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            programmeId: programme.id,
            startSessionId: academicSession.id,
            entryLevel: startingLevelStr,
            currentLevel: startingLevelStr,
            admissionPathway: pathway || (isDE ? 'Direct Entry' : 'UTME'),
            isActive: true,
            status: 'ACTIVE',
          },
        });
      } else {
        await prisma.programmeEnrollment.create({
          data: {
            studentId: application.applicantId,
            programmeId: programme.id,
            startSessionId: academicSession.id,
            entryLevel: startingLevelStr,
            currentLevel: startingLevelStr,
            admissionPathway: pathway || (isDE ? 'Direct Entry' : 'UTME'),
            isActive: true,
            status: 'ACTIVE',
            tenantId: application.schoolId,
          },
        });
      }
    }
  }

  return {
    message: 'Application status updated successfully',
    data: updatedApplication,
  };
};

/**
 * Create a new Academic Session for the school tenant.
 */
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

/**
 * Run Automated Student Level Progression Engine upon Academic Session activation:
 * 1. Promotes eligible active students (+100 level) if currentLevel < durationYears * 100.
 * 2. Capped / Final-Year Students:
 *    - If student has failing grades ('F' or score < 45) -> Mark status as SPILLOVER (remains at max level).
 *    - If student has passed all courses with no failing grades -> Mark status as GRADUATED and deactivate enrollment.
 * 3. Idempotency protection via lastPromotedSessionId to ensure students are only promoted once per session.
 */
export const runStudentLevelProgressionEngine = async (
  tenantId: string,
  newSessionId: string,
) => {
  const students = await prisma.user.findMany({
    where: {
      tenantId,
      role: 'STUDENT',
    },
    include: {
      programmeEnrollments: {
        where: { isActive: true },
        include: {
          programme: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      grades: {
        select: {
          score: true,
          letterGrade: true,
        },
      },
    },
  });

  let promotedCount = 0;
  let graduatedCount = 0;
  let spilloverCount = 0;
  let skippedCount = 0;

  for (const student of students) {
    const activeEnrollment = student.programmeEnrollments[0];

    // Check idempotency: If already processed for this session, skip
    if (activeEnrollment && activeEnrollment.lastPromotedSessionId === newSessionId) {
      skippedCount++;
      continue;
    }

    const durationYears = activeEnrollment?.programme?.durationYears || 4;
    const maxLevel = durationYears * 100;

    const currentLevelNum =
      student.level ||
      (activeEnrollment?.currentLevel ? parseInt(activeEnrollment.currentLevel.replace(/\D/g, ''), 10) : 100) ||
      100;

    if (currentLevelNum < maxLevel) {
      // Regular promotion: +100 level
      const newLevelNum = currentLevelNum + 100;
      const newLevelStr = `${newLevelNum} Level`;

      await prisma.user.update({
        where: { id: student.id },
        data: { level: newLevelNum },
      });

      if (activeEnrollment) {
        await prisma.programmeEnrollment.update({
          where: { id: activeEnrollment.id },
          data: {
            currentLevel: newLevelStr,
            lastPromotedSessionId: newSessionId,
            status: 'ACTIVE',
          },
        });
      } else {
        const defaultProg = await prisma.programme.findFirst({
          where: {
            tenantId,
            departmentId: student.departmentId || undefined,
          },
        });
        if (defaultProg) {
          await prisma.programmeEnrollment.create({
            data: {
              studentId: student.id,
              programmeId: defaultProg.id,
              startSessionId: newSessionId,
              entryLevel: '100 Level',
              currentLevel: newLevelStr,
              admissionPathway: 'UTME',
              isActive: true,
              status: 'ACTIVE',
              lastPromotedSessionId: newSessionId,
              tenantId,
            },
          });
        }
      }

      promotedCount++;
    } else {
      // Final Year student reached or exceeded max level -> Check carryovers
      const hasCarryovers = student.grades.some(
        (g) => g.letterGrade === 'F' || (g.score !== null && g.score !== undefined && g.score < 45),
      );

      if (hasCarryovers) {
        // Carryover / Spillover: Remain at max level
        if (activeEnrollment) {
          await prisma.programmeEnrollment.update({
            where: { id: activeEnrollment.id },
            data: {
              lastPromotedSessionId: newSessionId,
              status: 'SPILLOVER',
              isActive: true,
            },
          });
        }
        spilloverCount++;
      } else {
        // No carryovers: Mark as Graduated
        if (activeEnrollment) {
          await prisma.programmeEnrollment.update({
            where: { id: activeEnrollment.id },
            data: {
              lastPromotedSessionId: newSessionId,
              status: 'GRADUATED',
              isActive: false,
            },
          });
        }
        graduatedCount++;
      }
    }
  }

  return {
    totalStudents: students.length,
    promotedCount,
    graduatedCount,
    spilloverCount,
    skippedCount,
  };
};

/**
 * Activate a specific Academic Session, automatically deactivating other sessions
 * and executing the automated student level progression engine.
 */
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

  // Run the automated level progression & graduation engine
  const progressionResult = await runStudentLevelProgressionEngine(
    actor.tenantId,
    sessionId,
  );

  return {
    message: 'Academic session activated successfully.',
    session: updated,
    progression: progressionResult,
  };
};

/**
 * Create a new Academic Semester nested under a specific session.
 */
export const createSemester = async (
  sessionId: string,
  payload: { name: Semester; isActive?: boolean },
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

/**
 * Activate an Academic Semester, deactivating other semesters in the same session.
 */
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

/**
 * Fetch all Academic Sessions configured for the tenant.
 */
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

/**
 * Fetch a paginated list of admitted students.
 * Automatically scopes results to a department if requested by an HOD.
 */
export const getAdmittedStudents = async (
  query: {
    page: number;
    limit: number;
    search?: string;
    programmeId?: string;
    session?: string;
  },
  actor: ActorContext & { role?: string },
) => {
  if (!actor.tenantId) {
    throw createError(400, 'User account is not linked to a tenant.');
  }

  const { page, limit, search, programmeId, session } = query;
  const skip = (page - 1) * limit;

  // Build the dynamic Prisma filter
  const where: any = {
    role: 'STUDENT',
    tenantId: actor.tenantId,
  };

  const enrollmentFilter: any = { isActive: true };

  if (programmeId) {
    enrollmentFilter.programmeId = programmeId;
  }

  if (session) {
    enrollmentFilter.startSession = {
      name: session,
    };
  }

  // If HOD, scope visibility to HOD's department only
  if (actor.role === 'HOD') {
    if (programmeId) {
      // If programmeId is supplied, verify it belongs to HOD's department
      const programme = await prisma.programme.findFirst({
        where: {
          id: programmeId,
          tenantId: actor.tenantId,
          department: {
            hodId: actor.id,
          },
        },
      });
      if (!programme) {
        throw createError(403, 'You do not have permission to view students in this programme.');
      }
    }
    
    // Set HOD department filter on programme enrollment
    enrollmentFilter.programme = {
      department: {
        hodId: actor.id,
      },
    };
  }

  // If either programmeId, session, or HOD role is present, filter using programmeEnrollments some
  if (programmeId || session || actor.role === 'HOD') {
    where.programmeEnrollments = {
      some: enrollmentFilter,
    };
  }

  // Text search on firstName, lastName, or email
  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    where.OR = [
      { firstName: { contains: trimmedSearch, mode: 'insensitive' } },
      { lastName: { contains: trimmedSearch, mode: 'insensitive' } },
      { email: { contains: trimmedSearch, mode: 'insensitive' } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isVerified: true,
        level: true,
        staffId: true,
        department: true,
        createdAt: true,
        updatedAt: true,
        programmeEnrollments: {
          where: { isActive: true },
          include: {
            programme: {
              select: {
                id: true,
                name: true,
                code: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  const formattedStudents = students.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    phoneNumber: s.phoneNumber,
    role: s.role,
    isVerified: s.isVerified,
    level: s.level,
    matricNumber: s.staffId || null,
    department: s.department,
    programmeEnrollments: s.programmeEnrollments,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));

  return {
    data: formattedStudents,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Retrieve a paginated and filterable list of lecturers in the school.
 * HODs can only view lecturers within their managed department(s).
 * School Admins can view all lecturers in the tenant/school.
 */
export const getLecturers = async (
  query: {
    page: number;
    limit: number;
    search?: string;
    departmentId?: string;
  },
  actor: ActorContext & { role?: string },
) => {
  if (!actor.tenantId) {
    throw createError(400, 'User account is not linked to a tenant.');
  }

  const { page, limit, search, departmentId } = query;
  const skip = (page - 1) * limit;

  // Build the dynamic filter
  const where: any = {
    role: 'LECTURER',
    tenantId: actor.tenantId,
  };

  if (departmentId) {
    where.departmentId = departmentId;
  }

  // Text search on firstName, lastName, or email
  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    where.OR = [
      { firstName: { contains: trimmedSearch, mode: 'insensitive' } },
      { lastName: { contains: trimmedSearch, mode: 'insensitive' } },
      { email: { contains: trimmedSearch, mode: 'insensitive' } },
    ];
  }

  const [lecturers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isVerified: true,
        staffId: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { departmentId: 'asc' },
        { firstName: 'asc' },
      ],
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: lecturers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all HODs for the school tenant.
 */
export const getHODs = async (tenantId: string) => {
  return prisma.user.findMany({
    where: {
      tenantId,
      role: 'HOD',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      staffId: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { firstName: 'asc' },
  });
};

/**
 * Assign/reassign a lecturer as HOD of a department.
 */
export const assignHODToDepartment = async (
  departmentId: string,
  hodId: string,
  tenantId: string,
) => {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, tenantId },
  });

  if (!department) {
    throw createError(404, 'Department not found.');
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: hodId,
      tenantId,
      role: { in: ['LECTURER', 'HOD'] },
    },
  });

  if (!targetUser) {
    throw createError(404, 'Target user not found or not eligible to be HOD.');
  }

  // Enforce one HOD per department constraint: check if this user is HOD of another department
  const existingHodDept = await prisma.department.findFirst({
    where: {
      hodId,
      id: { not: departmentId },
      tenantId,
    },
  });

  if (existingHodDept) {
    throw createError(
      400,
      `This user is already assigned as the HOD of another department (${existingHodDept.name}).`,
    );
  }

  const previousHodId = department.hodId;

  // Demote previous HOD if exists
  if (previousHodId && previousHodId !== hodId) {
    const otherDeptsCount = await prisma.department.count({
      where: {
        hodId: previousHodId,
        id: { not: departmentId },
        tenantId,
      },
    });
    if (otherDeptsCount === 0) {
      await prisma.user.update({
        where: { id: previousHodId },
        data: { role: 'LECTURER' },
      });
    }
  }

  // Promote new HOD user
  await prisma.user.update({
    where: { id: hodId },
    data: { role: 'HOD' },
  });

  // Assign to department
  return prisma.department.update({
    where: { id: departmentId },
    data: { hodId },
    include: {
      hod: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
};

/**
 * Remove the HOD from a department and demote them to LECTURER.
 */
export const removeHODFromDepartment = async (
  departmentId: string,
  tenantId: string,
) => {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, tenantId },
  });

  if (!department) {
    throw createError(404, 'Department not found.');
  }

  const currentHodId = department.hodId;

  if (!currentHodId) {
    return department;
  }

  // Check if they manage other departments. If not, demote to LECTURER
  const otherDeptsCount = await prisma.department.count({
    where: {
      hodId: currentHodId,
      id: { not: departmentId },
      tenantId,
    },
  });

  if (otherDeptsCount === 0) {
    await prisma.user.update({
      where: { id: currentHodId },
      data: { role: 'LECTURER' },
    });
  }

  // Remove from department
  return prisma.department.update({
    where: { id: departmentId },
    data: { hodId: null },
    include: {
      hod: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
};

/**
 * Issue an Admission Offer (original choice or realigned course) to an applicant.
 */
export const issueAdmissionOffer = async (
  applicationId: string,
  payload: {
    offeredCourse: string;
    offeredFaculty: string;
    offeredDepartmentId?: string;
    isAlternativeOffer?: boolean;
    remarks?: string;
    deadlineDays?: number;
  },
  actor: ActorContext
) => {
  if (!actor.tenantId) {
    throw createError(400, 'Officer context is missing tenantId.');
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      applicant: true,
      school: true,
    },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.schoolId !== actor.tenantId) {
    throw createError(403, 'You do not have permission to manage this application.');
  }

  const originalCourse = application.programmeSelection?.course || payload.offeredCourse;
  const originalFaculty = application.programmeSelection?.faculty || payload.offeredFaculty;

  const deadlineDays = payload.deadlineDays || 14;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + deadlineDays);

  // Upsert AdmissionOffer record
  const offer = await prisma.admissionOffer.upsert({
    where: { applicationId },
    update: {
      offeredCourse: payload.offeredCourse,
      offeredFaculty: payload.offeredFaculty,
      offeredDepartmentId: payload.offeredDepartmentId || null,
      isAlternativeOffer: payload.isAlternativeOffer ?? false,
      remarks: payload.remarks || null,
      status: 'PENDING',
      expiresAt,
      issuedById: actor.id,
      acceptedAt: null,
      declinedAt: null,
      declineReason: null,
    },
    create: {
      applicationId,
      applicantId: application.applicantId,
      tenantId: actor.tenantId,
      originalCourse,
      originalFaculty,
      offeredCourse: payload.offeredCourse,
      offeredFaculty: payload.offeredFaculty,
      offeredDepartmentId: payload.offeredDepartmentId || null,
      isAlternativeOffer: payload.isAlternativeOffer ?? false,
      remarks: payload.remarks || null,
      status: 'PENDING',
      expiresAt,
      issuedById: actor.id,
    },
  });

  // Update application status to OFFER_ISSUED
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'OFFER_ISSUED' },
  });

  // Send notification email to applicant
  if (application.applicant?.email) {
    await sendOfferIssuedEmail({
      email: application.applicant.email,
      applicantName: `${application.applicant.firstName} ${application.applicant.lastName}`,
      schoolName: application.school.schoolName,
      offeredCourse: payload.offeredCourse,
      offeredFaculty: payload.offeredFaculty,
      isAlternativeOffer: payload.isAlternativeOffer ?? false,
      deadlineDays,
    });
  }

  return {
    message: 'Admission offer issued successfully.',
    offer,
  };
};

/**
 * Get all issued admission offers with filters.
 */
export const getAdmissionOffers = async (
  query: {
    page: number;
    limit: number;
    search?: string;
    status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
    isAlternativeOffer?: boolean;
  },
  tenantId: string
) => {
  const { page, limit, search, status, isAlternativeOffer } = query;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId };

  if (status) {
    where.status = status;
  }

  if (typeof isAlternativeOffer === 'boolean') {
    where.isAlternativeOffer = isAlternativeOffer;
  }

  if (search) {
    where.OR = [
      { offeredCourse: { contains: search, mode: 'insensitive' } },
      { originalCourse: { contains: search, mode: 'insensitive' } },
      { applicant: { firstName: { contains: search, mode: 'insensitive' } } },
      { applicant: { lastName: { contains: search, mode: 'insensitive' } } },
      { applicant: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, offers] = await Promise.all([
    prisma.admissionOffer.count({ where }),
    prisma.admissionOffer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        application: {
          select: {
            id: true,
            applicationNumber: true,
            status: true,
            programmeSelection: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    offers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


