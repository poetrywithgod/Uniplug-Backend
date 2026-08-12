import createError from 'http-errors';
import prisma from '../../configs/prismaConfig';
import { CourseCategory, AssignmentStatus, LecturerRole, EnrollmentStatus, Semester } from '../../../generated/prisma';

// Helper to compute standard Nigerian tertiary letter grades
export const calculateLetterGrade = (score: number): string => {
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 45) return 'D';
  if (score >= 40) return 'E';
  return 'F';
};

// --- Departments ---
/**
 * Create a new Department under a specific school tenant.
 */
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

/**
 * Fetch all departments configured for a school tenant, including HOD and Faculty details.
 */
export const getDepartments = async (tenantId: string) => {
  const departments = await prisma.department.findMany({
    where: { tenantId },
    include: {
      hod: { select: { id: true, firstName: true, lastName: true, email: true } },
      faculty: { select: { id: true, name: true, code: true } },
    },
  });

  const departmentsWithCounts = await Promise.all(
    departments.map(async (dept) => {
      const lecturerCount = await prisma.user.count({
        where: {
          tenantId,
          role: 'LECTURER',
          departmentId: dept.id,
        },
      });
      return {
        ...dept,
        totalLecturers: lecturerCount,
      };
    })
  );

  return { departments: departmentsWithCounts };
};

// --- Faculties ---
/**
 * Create a new Faculty record under a school tenant.
 */
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

/**
 * Fetch all faculties configured for a school tenant.
 */
export const getFaculties = async (tenantId: string) => {
  const faculties = await prisma.faculty.findMany({
    where: { tenantId },
    include: { departments: true },
    orderBy: { name: 'asc' },
  });
  return { faculties };
};

// --- Courses ---
/**
 * Create a new course definition (master definition) in a specific department.
 */
export const createCourse = async (
  payload: {
    courseName: string;
    courseCode: string;
    creditUnits: number;
    level: number;
    category: 'CORE' | 'ELECTIVE' | 'GENERAL_STUDIES';
    semester: Semester;
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
      semester: payload.semester,
      category: payload.category as CourseCategory,
      description: payload.description,
      departmentId: payload.departmentId,
      createdByHodId,
      tenantId,
    },
  });

  return { course };
};

/**
 * Fetch all courses registered under a specific department and school tenant.
 */
export const getCourses = async (departmentId: string, tenantId: string) => {
  const courses = await prisma.course.findMany({
    where: { departmentId, tenantId },
  });
  return { courses };
};

// --- Course Offerings ---
/**
 * Create an active semester offering (CourseOffering) for a course.
 */
export const createCourseOffering = async (
  payload: { courseId: string; lecturerIds?: string[] },
  tenantId: string,
  assignedById?: string
) => {

  const course = await prisma.course.findFirst({
    where: { id: payload.courseId, tenantId },
  });
  if (!course) {
    throw createError(404, 'Course not found.');
  }

  // Find active academic session for the tenant
  const activeSession = await prisma.academicSession.findFirst({
    where: { tenantId, isActive: true },
  });
  if (!activeSession) {
    throw createError(400, 'Active academic session not found. Please activate a session first.');
  }

  // Check semester timing validation
  const activeSem = await prisma.academicSemester.findFirst({
    where: { sessionId: activeSession.id, isActive: true },
  });

  if (activeSem?.name === 'SECOND_SEMESTER' && course.semester === 'FIRST_SEMESTER') {
    throw createError(400, 'Cannot create offerings for first semester courses during the second semester.');
  }

  // Check if offering already exists for this session
  const existing = await prisma.courseOffering.findFirst({
    where: {
      courseId: payload.courseId,
      academicSession: activeSession.name,
      tenantId,
    },
  });
  if (existing) {
    throw createError(409, 'Course offering already exists for this session.');
  }

  // Validate lecturerIds if provided
  const uniqueLecturerIds = payload.lecturerIds ? [...new Set(payload.lecturerIds)] : [];
  if (uniqueLecturerIds.length > 0) {
    const lecturersCount = await prisma.user.count({
      where: {
        id: { in: uniqueLecturerIds },
        role: 'LECTURER',
        tenantId,
      },
    });
    if (lecturersCount !== uniqueLecturerIds.length) {
      throw createError(400, 'One or more provided lecturer IDs are invalid or do not belong to this school.');
    }
  }

  return prisma.$transaction(async (tx) => {
    const offering = await tx.courseOffering.create({
      data: {
        courseId: payload.courseId,
        academicSession: activeSession.name,
        tenantId,
      },
    });

    if (uniqueLecturerIds.length > 0) {
      await Promise.all(
        uniqueLecturerIds.map((lecturerId) =>
          tx.courseAssignment.create({
            data: {
              courseOfferingId: offering.id,
              lecturerId,
              assignedById,
              status: 'APPROVED',
              role: 'LEAD_LECTURER',
              tenantId,
            },
          })
        )
      );
    }

    return { offering };
  });
};

/**
 * Fetch all active course offerings registered for a school tenant.
 */
export const getCourseOfferings = async (tenantId: string) => {
  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, status: 'ACTIVE' },
    include: { course: true },
  });
  return { offerings };
};

// --- Lecturer Course Offerings & Dashboard ---
/**
 * Retrieve all course offerings assigned to a specific lecturer,
 * complete with enrolled student counts, grading progress %, schedule, and materials.
 */
export const getLecturerCourses = async (lecturerId: string, tenantId: string) => {
  const assignments = await prisma.courseAssignment.findMany({
    where: {
      lecturerId,
      status: 'APPROVED',
      tenantId,
    },
    include: {
      courseOffering: {
        include: {
          course: {
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                  faculty: { select: { id: true, name: true, code: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const coursesWithDetails = await Promise.all(
    assignments.map(async (assignment) => {
      const offering = assignment.courseOffering;

      // Count total enrolled students
      const totalStudents = await prisma.courseEnrollment.count({
        where: {
          courseOfferingId: offering.id,
          status: 'ENROLLED',
          tenantId,
        },
      });

      // Count graded students
      const gradedStudents = await prisma.grade.count({
        where: {
          courseOfferingId: offering.id,
          tenantId,
        },
      });

      const gradingProgress =
        totalStudents > 0 ? Math.round((gradedStudents / totalStudents) * 100) : 0;

      return {
        assignmentId: assignment.id,
        lecturerRole: assignment.role,
        courseOfferingId: offering.id,
        academicSession: offering.academicSession,
        semester: offering.course.semester,
        status: offering.status,
        schedule: offering.schedule || null,
        syllabus: offering.syllabus || null,
        materialsCount: offering.materials?.length || 0,
        materials: offering.materials || [],
        totalStudents,
        gradedStudents,
        gradingProgress, // e.g. 60
        course: {
          id: offering.course.id,
          courseCode: offering.course.courseCode,
          courseName: offering.course.courseName,
          creditUnits: offering.course.creditUnits,
          level: offering.course.level,
          category: offering.course.category,
          description: offering.course.description,
          department: offering.course.department,
        },
      };
    })
  );

  return { courses: coursesWithDetails };
};

// --- Course Schedule ---
/**
 * Set or update the schedule (venue, day, time) for a course offering.
 */
export const setCourseSchedule = async (
  courseOfferingId: string,
  payload: { venue: string; day: string; time: string },
  lecturerId: string,
  tenantId: string
) => {
  // Validate lecturer assignment
  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      courseOfferingId,
      lecturerId,
      status: 'APPROVED',
      tenantId,
    },
  });

  if (!assignment) {
    throw createError(403, 'You are not assigned to this course offering.');
  }

  const updatedOffering = await prisma.courseOffering.update({
    where: { id: courseOfferingId },
    data: {
      schedule: {
        set: {
          venue: payload.venue,
          day: payload.day,
          time: payload.time,
          updatedAt: new Date(),
        },
      },
    },
    include: { course: true },
  });

  return {
    message: 'Course schedule updated successfully.',
    schedule: updatedOffering.schedule,
  };
};

/**
 * Delete / remove the schedule from a course offering.
 */
export const deleteCourseSchedule = async (
  courseOfferingId: string,
  lecturerId: string,
  tenantId: string
) => {
  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      courseOfferingId,
      lecturerId,
      status: 'APPROVED',
      tenantId,
    },
  });

  if (!assignment) {
    throw createError(403, 'You are not assigned to this course offering.');
  }

  await prisma.courseOffering.update({
    where: { id: courseOfferingId },
    data: {
      schedule: {
        unset: true,
      },
    },
  });

  return {
    message: 'Course schedule deleted successfully.',
  };
};

// --- Course Syllabus ---
/**
 * Set or update the syllabus details & attached document URL for a course offering.
 */
export const setCourseSyllabus = async (
  courseOfferingId: string,
  payload: { title?: string; description?: string; fileUrl?: string; fileName?: string },
  lecturerId: string,
  tenantId: string
) => {
  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      courseOfferingId,
      lecturerId,
      status: 'APPROVED',
      tenantId,
    },
  });

  if (!assignment) {
    throw createError(403, 'You are not assigned to this course offering.');
  }

  const updatedOffering = await prisma.courseOffering.update({
    where: { id: courseOfferingId },
    data: {
      syllabus: {
        set: {
          title: payload.title || null,
          description: payload.description || null,
          fileUrl: payload.fileUrl || null,
          fileName: payload.fileName || null,
          uploadedAt: new Date(),
        },
      },
    },
  });

  return {
    message: 'Course syllabus updated successfully.',
    syllabus: updatedOffering.syllabus,
  };
};

/**
 * Delete / remove the syllabus from a course offering.
 */
export const deleteCourseSyllabus = async (
  courseOfferingId: string,
  lecturerId: string,
  tenantId: string
) => {
  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      courseOfferingId,
      lecturerId,
      status: 'APPROVED',
      tenantId,
    },
  });

  if (!assignment) {
    throw createError(403, 'You are not assigned to this course offering.');
  }

  await prisma.courseOffering.update({
    where: { id: courseOfferingId },
    data: {
      syllabus: {
        unset: true,
      },
    },
  });

  return {
    message: 'Course syllabus deleted successfully.',
  };
};

// --- Course Materials ---
/**
 * Add 1 or more materials (PDFs, images, slides, documents) to a course offering.
 */
export const addCourseMaterials = async (
  courseOfferingId: string,
  payload: {
    materials: {
      title: string;
      fileUrl: string;
      fileType: string;
      fileSize?: number;
    }[];
  },
  lecturerId: string,
  tenantId: string
) => {
  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      courseOfferingId,
      lecturerId,
      status: 'APPROVED',
      tenantId,
    },
  });

  if (!assignment) {
    throw createError(403, 'You are not assigned to this course offering.');
  }

  const offering = await prisma.courseOffering.findUnique({
    where: { id: courseOfferingId },
  });

  if (!offering) {
    throw createError(404, 'Course offering not found.');
  }

  const currentMaterials = offering.materials || [];
  const newMaterials = payload.materials.map((m) => ({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: m.title,
    fileUrl: m.fileUrl,
    fileType: m.fileType,
    fileSize: m.fileSize || null,
    uploadedAt: new Date(),
  }));

  const updatedOffering = await prisma.courseOffering.update({
    where: { id: courseOfferingId },
    data: {
      materials: {
        set: [...currentMaterials, ...newMaterials],
      },
    },
  });

  return {
    message: `${newMaterials.length} material(s) added successfully.`,
    materials: updatedOffering.materials,
  };
};

/**
 * Delete an individual material from a course offering.
 */
export const deleteCourseMaterial = async (
  courseOfferingId: string,
  materialId: string,
  lecturerId: string,
  tenantId: string
) => {
  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      courseOfferingId,
      lecturerId,
      status: 'APPROVED',
      tenantId,
    },
  });

  if (!assignment) {
    throw createError(403, 'You are not assigned to this course offering.');
  }

  const offering = await prisma.courseOffering.findUnique({
    where: { id: courseOfferingId },
  });

  if (!offering) {
    throw createError(404, 'Course offering not found.');
  }

  const currentMaterials = offering.materials || [];
  const filtered = currentMaterials.filter((m) => m.id !== materialId);

  if (filtered.length === currentMaterials.length) {
    throw createError(404, 'Material not found on this course offering.');
  }

  const updatedOffering = await prisma.courseOffering.update({
    where: { id: courseOfferingId },
    data: {
      materials: {
        set: filtered,
      },
    },
  });

  return {
    message: 'Material deleted successfully.',
    materials: updatedOffering.materials,
  };
};

// --- Lecturer Assignments ---
/**
 * Request course assignment for a lecturer to teach a course offering.
 */
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

/**
 * HOD decision handler to approve or reject a lecturer's course assignment request.
 */
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

/**
 * Fetch all pending lecturer course assignments for an HOD's school.
 */
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
/**
 * Register course offerings for a student, enforcing level eligibility rules.
 */
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

/**
 * Fetch all course offering enrollments registered for a student.
 */
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
/**
 * Fetch students enrolled in a course offering (the student roster), including matriculation number,
 * CA score (30), Exam score (70), total score, letter grade, and remarks.
 */
export const getEnrolledStudents = async (
  courseOfferingId: string,
  userId: string,
  userRole: string,
  tenantId: string
) => {
  // Authorization: Must be HOD, School Admin, or the assigned lecturer for this offering
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

  const offering = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, tenantId },
    include: { course: true },
  });
  if (!offering) {
    throw createError(404, 'Course offering not found.');
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
          staffId: true,
          adminId: true,
        },
      },
    },
    orderBy: { student: { lastName: 'asc' } },
  });

  // Map students and attach detailed grades matching the UI table
  const studentsRoster = await Promise.all(
    enrollments.map(async (e) => {
      const grade = await prisma.grade.findFirst({
        where: { studentId: e.studentId, courseOfferingId, tenantId },
      });

      const matricNo = e.student.staffId || e.student.adminId || `STU-${e.student.id.substring(18)}`;
      const caScore = grade?.caScore ?? null;
      const examScore = grade?.examScore ?? null;
      const totalScore = grade?.score ?? null;
      const letterGrade = grade?.letterGrade ?? (totalScore !== null ? calculateLetterGrade(totalScore) : null);
      const remarks = grade?.remarks ?? null;

      return {
        studentId: e.student.id,
        matricNo,
        name: `${e.student.firstName} ${e.student.lastName}`.trim(),
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        email: e.student.email,
        level: e.student.level,
        caScore,     // e.g. 28 / 30
        examScore,   // e.g. 60 / 70
        totalScore,  // e.g. 88
        grade: letterGrade, // e.g. "A"
        remarks,     // e.g. "Excellent work"
        updatedAt: grade?.updatedAt || null,
      };
    })
  );

  return {
    course: {
      id: offering.course.id,
      courseCode: offering.course.courseCode,
      courseName: offering.course.courseName,
      creditUnits: offering.course.creditUnits,
      level: offering.course.level,
      semester: offering.course.semester,
      academicSession: offering.academicSession,
    },
    totalStudents: studentsRoster.length,
    students: studentsRoster,
  };
};

/**
 * Record or update grading scores (CA, Exam, total score, letter grade, remarks) submitted by an assigned lecturer.
 */
export const submitGrades = async (
  courseOfferingId: string,
  payload: {
    grades: {
      studentId: string;
      caScore?: number;
      examScore?: number;
      score?: number;
      remarks?: string;
    }[];
  },
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
    // Verify student is enrolled
    const isEnrolled = await prisma.courseEnrollment.findFirst({
      where: { studentId: gradeItem.studentId, courseOfferingId, status: 'ENROLLED', tenantId },
    });
    if (!isEnrolled) {
      throw createError(400, `Student ${gradeItem.studentId} is not enrolled in this course offering.`);
    }

    const ca = gradeItem.caScore ?? 0;
    const exam = gradeItem.examScore ?? 0;
    const total = gradeItem.score !== undefined ? gradeItem.score : ca + exam;
    const letterGrade = calculateLetterGrade(total);

    // Upsert grade
    const existingGrade = await prisma.grade.findFirst({
      where: { studentId: gradeItem.studentId, courseOfferingId, tenantId },
    });

    let grade;
    if (existingGrade) {
      grade = await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          caScore: ca,
          examScore: exam,
          score: total,
          letterGrade,
          remarks: gradeItem.remarks || null,
          gradedById,
        },
      });
    } else {
      grade = await prisma.grade.create({
        data: {
          studentId: gradeItem.studentId,
          courseOfferingId,
          caScore: ca,
          examScore: exam,
          score: total,
          letterGrade,
          remarks: gradeItem.remarks || null,
          gradedById,
          tenantId,
        },
      });
    }
    results.push(grade);
  }

  return {
    message: `Grades recorded successfully for ${results.length} student(s).`,
    grades: results,
  };
};

// --- Programmes ---
/**
 * Create a new academic programme definition in a department.
 */
export const createProgramme = async (
  payload: {
    name: string;
    code: string;
    durationYears: number;
    creditRequirement: number;
    category: string;
    departmentId: string;
  },
  tenantId: string
) => {
  const dept = await prisma.department.findFirst({
    where: { id: payload.departmentId, tenantId },
  });
  if (!dept) {
    throw createError(404, 'Department not found in this school.');
  }

  const existing = await prisma.programme.findUnique({
    where: { code: payload.code },
  });
  if (existing) {
    throw createError(409, `Programme with code ${payload.code} already exists.`);
  }

  const programme = await prisma.programme.create({
    data: {
      name: payload.name,
      code: payload.code,
      durationYears: payload.durationYears,
      creditRequirement: payload.creditRequirement,
      category: payload.category,
      departmentId: payload.departmentId,
      tenantId,
    },
  });

  return { programme };
};

/**
 * Fetch all academic programmes configured for the tenant.
 */
export const getProgrammes = async (tenantId: string, departmentId?: string) => {
  const filter: any = { tenantId };
  if (departmentId) {
    filter.departmentId = departmentId;
  }
  const programmes = await prisma.programme.findMany({
    where: filter,
    include: {
      department: {
        select: {
          id: true,
          name: true,
          faculty: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const formattedProgrammes = programmes.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    durationYears: p.durationYears,
    creditRequirement: p.creditRequirement,
    category: p.category,
    departmentId: p.departmentId,
    department: {
      id: p.department.id,
      name: p.department.name,
    },
    facultyId: p.department.faculty?.id || null,
    faculty: p.department.faculty
      ? {
          id: p.department.faculty.id,
          name: p.department.faculty.name,
        }
      : null,
    tenantId: p.tenantId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return { programmes: formattedProgrammes };
};


/**
 * Enroll a student in an academic programme.
 */
export const createProgrammeEnrollment = async (
  payload: {
    studentId: string;
    programmeId: string;
    entryLevel: string;
    currentLevel: string;
    admissionPathway: string;
  },
  tenantId: string
) => {
  const student = await prisma.user.findFirst({
    where: { id: payload.studentId, tenantId, role: 'STUDENT' },
  });
  if (!student) {
    throw createError(404, 'Student user not found.');
  }

  const prog = await prisma.programme.findFirst({
    where: { id: payload.programmeId, tenantId },
  });
  if (!prog) {
    throw createError(404, 'Programme not found.');
  }

  const activeSession = await prisma.academicSession.findFirst({
    where: { tenantId, isActive: true },
  });
  if (!activeSession) {
    throw createError(400, 'Active academic session not found. Please activate a session first.');
  }

  const existing = await prisma.programmeEnrollment.findFirst({
    where: { studentId: payload.studentId, programmeId: payload.programmeId, isActive: true },
  });
  if (existing) {
    throw createError(409, 'Student is already actively enrolled in this programme.');
  }

  const enrollment = await prisma.programmeEnrollment.create({
    data: {
      studentId: payload.studentId,
      programmeId: payload.programmeId,
      startSessionId: activeSession.id,
      entryLevel: payload.entryLevel,
      currentLevel: payload.currentLevel,
      admissionPathway: payload.admissionPathway,
      tenantId,
    },
  });

  return { enrollment };
};

/**
 * Fetch all programme enrollment history records for a student.
 */
export const getStudentProgrammeEnrollments = async (studentId: string, tenantId: string) => {
  const enrollments = await prisma.programmeEnrollment.findMany({
    where: { studentId, tenantId },
    include: {
      programme: { select: { id: true, name: true, code: true, category: true } },
      startSession: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return { enrollments };
};
