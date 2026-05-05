import createError from 'http-errors';
import prisma from '../../configs/prismaConfig';
import {
  AcademicHistoryBody,
  PersonalDetailsBody,
  ProgrammeSelectionBody,
  StartApplicationBody,
} from '../../types/application';

import { ApplicationStatus } from '../../../generated/prisma';
import cloudinary from '../../configs/cloudinaryConfig';
import { 
  CLOUDINARY_CLOUD_NAME, 
  CLOUDINARY_API_KEY, 
  CLOUDINARY_API_SECRET 
} from '../../configs/envConfig';

export const getCloudinarySignature = async (
  applicantId: string,
  applicationId: string,
  payload: { documentType: string; fileName: string }
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.applicantId !== applicantId) {
    throw createError(403, 'You do not have permission to access this application.');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `applications/${applicationId}/${payload.documentType.toLowerCase()}`;
  
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    CLOUDINARY_API_SECRET || ''
  );

  return {
    signature,
    timestamp,
    folder,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
  };
};

export const addDocumentToApplication = async (
  applicantId: string,
  applicationId: string,
  payload: { documentType: 'TRANSCRIPT' | 'ID_PASSPORT' | 'PASSPORT_PHOTOGRAPH' | 'CERTIFICATE'; fileUrl: string }
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.applicantId !== applicantId) {
    throw createError(403, 'You do not have permission to edit this application.');
  }

  // Allow appending new documents. Filter out existing versions of the same documentType to overwrite them
  const existingDocuments = application.documents || [];
  const filteredDocs = existingDocuments.filter(doc => doc.documentType !== payload.documentType);
  
  const updatedDocs = [
    ...filteredDocs,
    {
      documentType: payload.documentType,
      fileUrl: payload.fileUrl,
      uploadedAt: new Date()
    }
  ];

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      documents: updatedDocs,
    },
  });

  return {
    message: 'Document saved successfully.',
    application: updatedApplication,
  };
};

export const startApplication = async (
  applicantId: string,
  payload: StartApplicationBody,
) => {
  const { schoolId } = payload;

  const tenant = await prisma.tenant.findUnique({
    where: { id: schoolId },
  });

  if (!tenant) {
    throw createError(404, 'School not found.');
  }

  // Apply constraint check strictly here before Prisma fails
  const existingApplication = await prisma.application.findUnique({
    where: {
      applicantId_schoolId: {
        applicantId,
        schoolId,
      },
    },
  });

  if (existingApplication) {
    throw createError(
      400,
      'You already have an application for this school.',
    );
  }

  const application = await prisma.application.create({
    data: {
      applicantId,
      schoolId,
      status: ApplicationStatus.DRAFT,
      progressPercentage: 20,
    },
  });

  return {
    message: 'Application started successfully.',
    application,
  };
};

export const updatePersonalDetails = async (
  applicantId: string,
  applicationId: string,
  payload: PersonalDetailsBody,
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.applicantId !== applicantId) {
    throw createError(403, 'You do not have permission to edit this application.');
  }

  if (application.status === 'SUBMITTED' || application.status === 'APPROVED') {
    throw createError(400, 'Cannot edit an application that has already been submitted.');
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      personalDetails: { ...payload },
      progressPercentage: Math.max(application.progressPercentage, 40),
    },
  });

  return {
    message: 'Personal details saved.',
    application: updatedApplication,
  };
};

export const updateAcademicHistory = async (
  applicantId: string,
  applicationId: string,
  payload: AcademicHistoryBody,
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.applicantId !== applicantId) {
    throw createError(403, 'You do not have permission to edit this application.');
  }

  if (application.status === 'SUBMITTED' || application.status === 'APPROVED') {
    throw createError(400, 'Cannot edit an application that has already been submitted.');
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      academicHistory: { ...payload },
      progressPercentage: Math.max(application.progressPercentage, 60),
    },
  });

  return {
    message: 'Academic history saved.',
    application: updatedApplication,
  };
};

export const updateProgrammeSelection = async (
  applicantId: string,
  applicationId: string,
  payload: ProgrammeSelectionBody,
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.applicantId !== applicantId) {
    throw createError(403, 'You do not have permission to edit this application.');
  }

  if (application.status === 'SUBMITTED' || application.status === 'APPROVED') {
    throw createError(400, 'Cannot edit an application that has already been submitted.');
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      programmeSelection: { ...payload },
      progressPercentage: Math.max(application.progressPercentage, 80),
    },
  });

  return {
    message: 'Programme selection saved.',
    application: updatedApplication,
  };
};

export const submitApplication = async (
  applicantId: string,
  applicationId: string,
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.applicantId !== applicantId) {
    throw createError(403, 'You do not have permission to submit this application.');
  }

  if (application.status === 'SUBMITTED' || application.status === 'APPROVED') {
    throw createError(400, 'Application has already been submitted.');
  }

  // Validate that all sections are complete
  if (!application.personalDetails) {
    throw createError(400, 'Personal details section is incomplete.');
  }
  if (!application.academicHistory) {
    throw createError(400, 'Academic history section is incomplete.');
  }
  if (!application.programmeSelection) {
    throw createError(400, 'Programme selection section is incomplete.');
  }

  // NOTE: Depending on requirements, validate documents array length
  // e.g. application.documents.length === 0 needs to be avoided 
  // Let's enforce at least 1 document for submission based on design step 4
  if (!application.documents || application.documents.length === 0) {
    throw createError(400, 'At least one document upload is required before submission.');
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: ApplicationStatus.SUBMITTED,
      progressPercentage: 100,
    },
  });

  return {
    message: 'Application submitted successfully.',
    application: updatedApplication,
  };
};

export const getMyApplications = async (applicantId: string) => {
  const applications = await prisma.application.findMany({
    where: { applicantId },
    include: {
      school: {
        select: {
          schoolName: true,
          email: true,
          address: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return applications;
};
