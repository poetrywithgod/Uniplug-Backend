import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import * as applicationService from './applicationService';

export const startApplication = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;

    const result = await applicationService.startApplication(
      applicantId,
      req.body,
    );

    res.status(200).json({
      message: result.message,
      data: result.application,
    });
  },
);

export const updatePersonalDetails = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const applicationId = req.params.applicationId as string;
    const data = req.body;

    const application = await applicationService.updatePersonalDetails(
      applicantId,
      applicationId,
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
      applicantId,
      applicationId,
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
      applicantId,
      applicationId,
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
    const data = req.body;

    const signatureData = await applicationService.getCloudinarySignature(
      applicantId,
      applicationId,
      data,
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
      applicantId,
      applicationId,
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
      applicantId,
      applicationId,
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
    const applications = await applicationService.getMyApplications(applicantId);

    res.status(200).json({
      status: 'success',
      applications,
    });
  },
);

export const handleGetMyOffer = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const offer = await applicationService.getApplicantOffer(applicantId);

    res.status(200).json({
      status: 'success',
      offer,
    });
  },
);

export const handleAcceptOffer = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const offerId = req.params.offerId as string;

    const result = await applicationService.acceptAdmissionOffer(offerId, applicantId);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const handleDeclineOffer = catchAsync(
  async (req: Request, res: Response) => {
    const applicantId = res.locals.user.id;
    const offerId = req.params.offerId as string;
    const { declineReason } = req.body;

    const result = await applicationService.declineAdmissionOffer(
      offerId,
      applicantId,
      declineReason
    );

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);
