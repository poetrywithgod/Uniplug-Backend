import createError from 'http-errors';
import prisma from '../../configs/prismaConfig';
import { CourseCategory, AssignmentStatus, LecturerRole, EnrollmentStatus } from '../../../generated/prisma';

// --- Departments ---
export const createDepartment = async (
  payload: { name: string; hodId?: string; facultyId?: string },
  tenantId: string
) => {
  if (payload.hodId) {
    const hodUser = await prisma.user.findUnique({
      where: { id: payload.hodId },
    });
    if (!hodUser || hodUser.role !== 'HOD') {
      throw createError(404, 'HOD user not found or does not have HOD role.');
    }
  }

  if (payload.facultyId) {
    const faculty = await prisma.faculty.findFirst({
      where: { id: payload.facultyId, tenantId },
    });
    if (!faculty) {
      throw createError(404, 'Faculty not found under this tenant.');
    }
  }

  const department = await prisma.department.create({
    data: {
      name: payload.name,
      hodId: payload.hodId,
      facultyId: payload.facultyId,
      tenantId,
    },
  });

  return { department };
};

export const getDepartments = async (tenantId: string) => {
  const departments = await prisma.department.findMany({
    where: { tenantId },
    include: {
      hod: { select: { id: true, firstName: true, lastName: true, email: true } },
      faculty: { select: { id: true, name: true, code: true } },
    },
  });
  return { departments };
};

// --- Faculties ---
export const createFaculty = async (
  payload: { name: string; code: string },
  tenantId: string
) => {
  const existing = await prisma.faculty.findFirst({
    where: {
      tenantId,
      OR: [
        { name: payload.name },
        { code: payload.code },
      ],
    },
  });

  if (existing) {
    throw createError(409, 'Faculty with this name or code already exists.');
  }

  const faculty = await prisma.faculty.create({
    data: {
      name: payload.name,
      code: payload.code,
      tenantId,
    },
  });

  return { faculty };
};

export const getFaculties = async (tenantId: string) => {
  const faculties = await prisma.faculty.findMany({
    where: { tenantId },
    include: { departments: true },
    orderBy: { name: 'asc' },
  });
  return { faculties };
};


// --- Courses ---
export const createCourse = async (
  payload: {
    courseName: string;
    courseCode: string;
    creditUnits: number;
    level: number;
    category: 'CORE' | 'ELECTIVE' | 'GENERAL_STUDIES';
    description?: string;
    departmentId: string;
  },
  createdByHodId: string,
  tenantId: string
) => {
  // Verify department exists
  const dept = await prisma.department.findFirst({
    where: { id: payload.departmentId, tenantId },
  });
  if (!dept) {
    throw createError(404, 'Department not found in this school.');
  }

  // Check code uniqueness within tenant
  const existing = await prisma.course.findFirst({
    where: { courseCode: payload.courseCode, tenantId },
  });
  if (existing) {
    throw createError(409, `Course with code ${payload.courseCode} already exists.`);
  }

  const course = await prisma.course.create({
    data: {
      courseName: payload.courseName,
      courseCode: payload.courseCode,
      creditUnits: payload.creditUnits,
      level: payload.level,
      category: payload.category as CourseCategory,
      description: payload.description,
      departmentId: payload.departmentId,
      createdByHodId,
      tenantId,
    },
  });

  return { course };
};

export const getCourses = async (departmentId: string, tenantId: string) => {
  const courses = await prisma.course.findMany({
    where: { departmentId, tenantId },
  });
  return { courses };
};

// --- Course Offerings ---
export const createCourseOffering = async (
  payload: { courseId: string; academicSession: string; semester: string },
  tenantId: string
) => {
  const course = await prisma.course.findFirst({
    where: { id: payload.courseId, tenantId },
  });
  if (!course) {
    throw createError(404, 'Course not found.');
  }

  // Check if offering already exists for this semester
  const existing = await prisma.courseOffering.findFirst({
    where: {
      courseId: payload.courseId,
      academicSession: payload.academicSession,
      semester: payload.semester,
      tenantId,
    },
  });
  if (existing) {
    throw createError(409, 'Course offering already exists for this session and semester.');
  }

  const offering = await prisma.courseOffering.create({
    data: {
      courseId: payload.courseId,
      academicSession: payload.academicSession,
      semester: payload.semester,
      tenantId,
    },
  });

  return { offering };
};

export const getCourseOfferings = async (tenantId: string) => {
  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, status: 'ACTIVE' },
    include: { course: true },
  });
  return { offerings };
};

// --- Lecturer Assignments ---
export const requestCourseAssignment = async (
  payload: { courseOfferingId: string; role?: 'LEAD_LECTURER' | 'CO_LECTURER' | 'TA' },
  lecturerId: string,
  tenantId: string
) => {
  const offering = await prisma.courseOffering.findFirst({
    where: { id: payload.courseOfferingId, tenantId },
  });
  if (!offering) {
    throw createError(404, 'Course offering not found.');
  }

  // Check if already assigned or requested
  const existing = await prisma.courseAssignment.findFirst({
    where: { courseOfferingId: payload.courseOfferingId, lecturerId, tenantId },
  });
  if (existing) {
    throw createError(409, 'You have already requested or been assigned to this offering.');
  }

  const assignment = await prisma.courseAssignment.create({
    data: {
      courseOfferingId: payload.courseOfferingId,
      lecturerId,
      role: (payload.role || 'LEAD_LECTURER') as LecturerRole,
      status: 'PENDING',
      tenantId,
    },
  });

  return { assignment };
};

export const approveCourseAssignment = async (
  assignmentId: string,
  status: 'APPROVED' | 'REJECTED',
  assignedById: string,
  tenantId: string
) => {
  const assignment = await prisma.courseAssignment.findFirst({
    where: { id: assignmentId, tenantId },
  });
  if (!assignment) {
    throw createError(404, 'Assignment request not found.');
  }

  const updatedAssignment = await prisma.courseAssignment.update({
    where: { id: assignmentId },
    data: {
      status: status as AssignmentStatus,
      assignedById,
    },
  });

  return { assignment: updatedAssignment };
};

export const getPendingAssignments = async (tenantId: string) => {
  const assignments = await prisma.courseAssignment.findMany({
    where: { status: 'PENDING', tenantId },
    include: {
      lecturer: { select: { id: true, firstName: true, lastName: true, email: true } },
      courseOffering: { include: { course: true } },
    },
  });
  return { assignments };
};

// --- Student Course Enrollment ---
export const registerCourseEnrollments = async (
  payload: { courseOfferingIds: string[] },
  studentId: string,
  tenantId: string
) => {
  const student = await prisma.user.findFirst({
    where: { id: studentId, tenantId },
  });
  if (!student || student.role !== 'STUDENT') {
    throw createError(403, 'Only students can register for courses.');
  }

  const studentLevel = student.level;
  if (studentLevel === null || studentLevel === undefined) {
    throw createError(400, 'Student level is not set. Please contact administration.');
  }

  const results = [];
  for (const offeringId of payload.courseOfferingIds) {
    const offering = await prisma.courseOffering.findFirst({
      where: { id: offeringId, tenantId },
      include: { course: true },
    });
    if (!offering) {
      throw createError(404, `Course offering ${offeringId} not found.`);
    }

    // Verify student level matches offering course level (or lower carryovers)
    if (offering.course.level > studentLevel) {
      throw createError(
        400,
        `Cannot register for ${offering.course.courseCode}. Level ${offering.course.level} is higher than your current level ${studentLevel}.`
      );
    }

    // Check if already registered
    const existing = await prisma.courseEnrollment.findFirst({
      where: { studentId, courseOfferingId: offeringId, tenantId },
    });
    if (existing) {
      continue; // Skip if already registered/pending
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        studentId,
        courseOfferingId: offeringId,
        status: 'ENROLLED',
        tenantId,
      },
    });
    results.push(enrollment);
  }

  return { enrollments: results };
};

export const getStudentEnrollments = async (studentId: string, tenantId: string) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId, tenantId },
    include: {
      courseOffering: {
        include: {
          course: true,
          assignments: {
            where: { status: 'APPROVED' },
            include: { lecturer: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
  });
  return { enrollments };
};

// --- Lecturer Grading & Roster ---
export const getEnrolledStudents = async (
  courseOfferingId: string,
  userId: string,
  userRole: string,
  tenantId: string
) => {
  // Authorization: Must be HOD, or the assigned lecturer for this offering
  if (userRole === 'LECTURER') {
    const isAssigned = await prisma.courseAssignment.findFirst({
      where: {
        courseOfferingId,
        lecturerId: userId,
        status: 'APPROVED',
        tenantId,
      },
    });
    if (!isAssigned) {
      throw createError(403, 'You are not assigned to teach this course offering.');
    }
  } else if (userRole !== 'HOD' && userRole !== 'SCHOOL_ADMIN') {
    throw createError(403, 'Unauthorized access.');
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseOfferingId, status: 'ENROLLED', tenantId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          level: true,
        },
      },
      courseOffering: {
        include: {
          grades: {
            where: { studentId: { in: [] } }, // placeholder, we will get grade separately
          },
        },
      },
    },
  });

  // Map students and attach grades
  const studentsRoster = await Promise.all(
    enrollments.map(async (e) => {
      const grade = await prisma.grade.findFirst({
        where: { studentId: e.studentId, courseOfferingId, tenantId },
        select: { score: true, updatedAt: true },
      });
      return {
        ...e.student,
        grade: grade ? grade.score : null,
      };
    })
  );

  return { students: studentsRoster };
};

export const submitGrades = async (
  courseOfferingId: string,
  payload: { grades: { studentId: string; score: number }[] },
  gradedById: string,
  tenantId: string
) => {
  // Validate lecturer is assigned to the offering
  const isAssigned = await prisma.courseAssignment.findFirst({
    where: {
      courseOfferingId,
      lecturerId: gradedById,
      status: 'APPROVED',
      tenantId,
    },
  });
  if (!isAssigned) {
    throw createError(403, 'You are not authorized to grade this course offering.');
  }

  const results = [];
  for (const gradeItem of payload.grades) {
    // Verify enrollment
    const isEnrolled = await prisma.courseEnrollment.findFirst({
      where: { studentId: gradeItem.studentId, courseOfferingId, status: 'ENROLLED', tenantId },
    });
    if (!isEnrolled) {
      throw createError(400, `Student ${gradeItem.studentId} is not enrolled in this course offering.`);
    }

    // Upsert grade
    const existingGrade = await prisma.grade.findFirst({
      where: { studentId: gradeItem.studentId, courseOfferingId, tenantId },
    });

    let grade;
    if (existingGrade) {
      grade = await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          score: gradeItem.score,
          gradedById,
        },
      });
    } else {
      grade = await prisma.grade.create({
        data: {
          studentId: gradeItem.studentId,
          courseOfferingId,
          score: gradeItem.score,
          gradedById,
          tenantId,
        },
      });
    }
    results.push(grade);
  }

  return { grades: results };
};
