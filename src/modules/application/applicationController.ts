import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import * as applicationService from './applicationService';

export const startApplication = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const { schoolId } = req.body;

    const application = await applicationService.startApplication(
      applicantId,
      schoolId,
    );

    res.status(201).json({
      message: 'Application started successfully',
      data: application,
    });
  },
);

export const updatePersonalDetails = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const applicationId = req.params.applicationId as string;
    const data = req.body;

    const application = await applicationService.updatePersonalDetails(
      applicationId,
      applicantId,
      data,
    );

    res.status(200).json({
      message: 'Personal details updated successfully',
      data: application,
    });
  },
);

export const updateAcademicHistory = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const applicationId = req.params.applicationId as string;
    const data = req.body;

    const application = await applicationService.updateAcademicHistory(
      applicationId,
      applicantId,
      data,
    );

    res.status(200).json({
      message: 'Academic history updated successfully',
      data: application,
    });
  },
);

export const updateProgrammeSelection = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const applicationId = req.params.applicationId as string;
    const data = req.body;

    const application = await applicationService.updateProgrammeSelection(
      applicationId,
      applicantId,
      data,
    );

    res.status(200).json({
      message: 'Programme selection updated successfully',
      data: application,
    });
  },
);

export const getCloudinarySignature = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const applicationId = req.params.applicationId as string;
    const { documentType } = req.body;

    const signatureData = await applicationService.getCloudinarySignature(
      applicationId,
      applicantId,
      documentType,
    );

    res.status(200).json({
      message: 'Cloudinary signature generated successfully',
      data: signatureData,
    });
  },
);

export const addDocumentToApplication = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const applicationId = req.params.applicationId as string;
    const data = req.body;

    const application = await applicationService.addDocumentToApplication(
      applicationId,
      applicantId,
      data,
    );

    res.status(200).json({
      message: 'Document added to application successfully',
      data: application,
    });
  },
);

export const submitApplication = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const applicationId = req.params.applicationId as string;

    const application = await applicationService.submitApplication(
      applicationId,
      applicantId,
    );

    res.status(200).json({
      message: 'Application submitted successfully',
      data: application,
    });
  },
);

export const getMyApplications = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;

    const applications =
      await applicationService.getMyApplications(applicantId);

    res.status(200).json({
      message: 'Applications retrieved successfully',
      data: applications,
    });
  },
);
