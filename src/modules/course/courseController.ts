import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import createError from 'http-errors';
import * as courseService from './courseService';

export const handleCreateDepartment = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.createDepartment(req.body, user.tenantId);
    res.status(201).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleGetDepartments = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.getDepartments(user.tenantId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleCreateFaculty = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.createFaculty(req.body, user.tenantId);
    res.status(201).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleGetFaculties = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.getFaculties(user.tenantId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleCreateCourse = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.createCourse(req.body, user.id, user.tenantId);
    res.status(201).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleGetCourses = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const departmentId = req.query.departmentId as string;
    if (!departmentId) {
      throw createError(400, 'departmentId query parameter is required.');
    }
    const result = await courseService.getCourses(departmentId, user.tenantId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleCreateCourseOffering = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.createCourseOffering(req.body, user.tenantId, user.id);
    res.status(201).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleGetCourseOfferings = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.getCourseOfferings(user.tenantId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

// --- Lecturer Course Offerings & Dashboard ---
export const handleGetLecturerCourses = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.getLecturerCourses(user.id, user.tenantId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

// --- Course Schedule ---
export const handleSetSchedule = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const courseOfferingId = req.params.courseOfferingId as string;
    const result = await courseService.setCourseSchedule(
      courseOfferingId,
      req.body,
      user.id,
      user.tenantId
    );
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleDeleteSchedule = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const courseOfferingId = req.params.courseOfferingId as string;
    const result = await courseService.deleteCourseSchedule(
      courseOfferingId,
      user.id,
      user.tenantId
    );
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

// --- Course Syllabus ---
export const handleSetSyllabus = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const courseOfferingId = req.params.courseOfferingId as string;
    const result = await courseService.setCourseSyllabus(
      courseOfferingId,
      req.body,
      user.id,
      user.tenantId
    );
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleDeleteSyllabus = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const courseOfferingId = req.params.courseOfferingId as string;
    const result = await courseService.deleteCourseSyllabus(
      courseOfferingId,
      user.id,
      user.tenantId
    );
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

// --- Course Materials ---
export const handleAddMaterials = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const courseOfferingId = req.params.courseOfferingId as string;
    const result = await courseService.addCourseMaterials(
      courseOfferingId,
      req.body,
      user.id,
      user.tenantId
    );
    res.status(201).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleDeleteMaterial = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const courseOfferingId = req.params.courseOfferingId as string;
    const materialId = req.params.materialId as string;
    const result = await courseService.deleteCourseMaterial(
      courseOfferingId,
      materialId,
      user.id,
      user.tenantId
    );
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

// --- Course Assignments ---
export const handleRequestCourseAssignment = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.requestCourseAssignment(req.body, user.id, user.tenantId);
    res.status(201).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleApproveCourseAssignment = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const assignmentId = req.params.assignmentId as string;
    const result = await courseService.approveCourseAssignment(
      assignmentId,
      req.body.status,
      user.id,
      user.tenantId
    );
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleGetPendingAssignments = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.getPendingAssignments(user.tenantId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

// --- Student Enrollments ---
export const handleRegisterCourseEnrollments = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.registerCourseEnrollments(req.body, user.id, user.tenantId);
    res.status(201).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleGetStudentEnrollments = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.getStudentEnrollments(user.id, user.tenantId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

// --- Lecturer Grading & Student Roster ---
export const handleGetEnrolledStudents = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const courseOfferingId = req.params.courseOfferingId as string;
    const result = await courseService.getEnrolledStudents(
      courseOfferingId,
      user.id,
      user.role,
      user.tenantId
    );
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleSubmitGrades = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const courseOfferingId = req.params.courseOfferingId as string;
    const result = await courseService.submitGrades(
      courseOfferingId,
      req.body,
      user.id,
      user.tenantId
    );
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

// --- Programmes ---
export const handleCreateProgramme = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.createProgramme(req.body, user.tenantId);
    res.status(201).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleGetProgrammes = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    const tenantId = user?.tenantId || (req.query.schoolId as string);
    if (!tenantId) {
      throw createError(400, 'Tenant context or schoolId is missing.');
    }
    const departmentId = req.query.departmentId as string | undefined;
    const result = await courseService.getProgrammes(tenantId, departmentId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleCreateProgrammeEnrollment = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.createProgrammeEnrollment(req.body, user.tenantId);
    res.status(201).json({
      status: 'success',
      ...result,
    });
  }
);

export const handleGetStudentProgrammeEnrollments = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const studentId = Array.isArray(req.params.studentId)
      ? req.params.studentId[0]
      : (req.params.studentId as string);

    if (user.role === 'STUDENT' && user.id !== studentId) {
      throw createError(403, 'You do not have permission to view other students enrollments.');
    }

    const result = await courseService.getStudentProgrammeEnrollments(studentId, user.tenantId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);

// Used by the student router - resolves to the logged-in student's own programme enrollments
export const handleGetMyProgrammeEnrollments = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is missing.');
    }
    const result = await courseService.getStudentProgrammeEnrollments(user.id, user.tenantId);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  }
);
