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
    const result = await courseService.createCourseOffering(req.body, user.tenantId);
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
    // Permit reading programmes even if tenantId is fetched from query for applicants
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

