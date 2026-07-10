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
  CLOUDINARY_API_SECRET,
} from '../../configs/envConfig';

/**
 * Generate a secure Cloudinary upload signature and parameters for file upload.
 */
export const getCloudinarySignature = async (
  applicantId: string,
  applicationId: string,
  payload: { documentType: string; fileName: string },
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.applicantId !== applicantId) {
    throw createError(
      403,
      'You do not have permission to access this application.',
    );
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `applications/${applicationId}/${payload.documentType.toLowerCase()}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    CLOUDINARY_API_SECRET || '',
  );

  return {
    signature,
    timestamp,
    folder,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
  };
};

/**
 * Save reference URL and type of an uploaded document to the admission application record.
 */
export const addDocumentToApplication = async (
  applicantId: string,
  applicationId: string,
  payload: {
    documentType:
      | 'TRANSCRIPT'
      | 'ID_PASSPORT'
      | 'PASSPORT_PHOTOGRAPH'
      | 'CERTIFICATE';
    fileUrl: string;
  },
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw createError(404, 'Application not found.');
  }

  if (application.applicantId !== applicantId) {
    throw createError(
      403,
      'You do not have permission to edit this application.',
    );
  }

  // Allow appending new documents. Filter out existing versions of the same documentType to overwrite them
  const existingDocuments = application.documents || [];
  const filteredDocs = existingDocuments.filter(
    (doc) => doc.documentType !== payload.documentType,
  );

  const updatedDocs = [
    ...filteredDocs,
    {
      documentType: payload.documentType,
      fileUrl: payload.fileUrl,
      uploadedAt: new Date(),
    },
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

/**
 * Initialize a new admission application draft for a school.
 */
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
    return {
      message: 'Existing application found. Continuing draft.',
      application: existingApplication,
    };
  }

  // Generate a unique application number prefixed by the school's unique ID
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const applicationNumber = `${tenant.schoolId}-APP-${randomStr}`;

  const application = await prisma.application.create({
    data: {
      applicantId,
      schoolId,
      applicationNumber,
      status: ApplicationStatus.DRAFT,
      progressPercentage: 20,
    },
  });

  return {
    message: 'Application started successfully.',
    application,
  };
};

/**
 * Update step 1 (Personal Details) of an admission application.
 */
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
    throw createError(
      403,
      'You do not have permission to edit this application.',
    );
  }

  if (application.status === 'SUBMITTED' || application.status === 'APPROVED') {
    throw createError(
      400,
      'Cannot edit an application that has already been submitted.',
    );
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

/**
 * Update step 2 (Academic History) of an admission application.
 */
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
    throw createError(
      403,
      'You do not have permission to edit this application.',
    );
  }

  if (application.status === 'SUBMITTED' || application.status === 'APPROVED') {
    throw createError(
      400,
      'Cannot edit an application that has already been submitted.',
    );
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

/**
 * Update step 3 (Programme Selection) of an admission application.
 */
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
    throw createError(
      403,
      'You do not have permission to edit this application.',
    );
  }

  if (application.status === 'SUBMITTED' || application.status === 'APPROVED') {
    throw createError(
      400,
      'Cannot edit an application that has already been submitted.',
    );
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

/**
 * Perform validation rules for mandatory documents depending on the admission pathway,
 * and finalize the submission of the application.
 */
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
    throw createError(
      403,
      'You do not have permission to submit this application.',
    );
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

  const pathway = application.programmeSelection.admissionPathway;
  const docs = application.documents || [];
  const uploadedTypes = docs.map((d) => d.documentType);

  if (pathway === 'UNDERGRADUATE') {
    const required = ['JAMB_RESULT', 'BIRTH_CERTIFICATE', 'LGA_CERTIFICATE', 'PASSPORT_PHOTOGRAPH'];
    for (const reqType of required) {
      if (!uploadedTypes.includes(reqType as any)) {
        throw createError(400, `Missing required document for Undergraduate regular pathway: ${reqType}`);
      }
    }
  } else if (pathway === 'DIRECT_ENTRY') {
    const required = ['TRANSCRIPT', 'CERTIFICATE', 'BIRTH_CERTIFICATE', 'LGA_CERTIFICATE', 'PASSPORT_PHOTOGRAPH'];
    for (const reqType of required) {
      if (!uploadedTypes.includes(reqType as any)) {
        throw createError(400, `Missing required document for Direct Entry pathway: ${reqType}`);
      }
    }
  } else if (pathway === 'PART_TIME') {
    const required = ['BIRTH_CERTIFICATE', 'LGA_CERTIFICATE', 'PASSPORT_PHOTOGRAPH'];
    for (const reqType of required) {
      if (!uploadedTypes.includes(reqType as any)) {
        throw createError(400, `Missing required document for Part-Time pathway: ${reqType}`);
      }
    }
  } else if (pathway === 'POSTGRADUATE') {
    const required = ['TRANSCRIPT', 'CERTIFICATE', 'CV', 'STATEMENT_OF_PURPOSE', 'PASSPORT_PHOTOGRAPH'];
    for (const reqType of required) {
      if (!uploadedTypes.includes(reqType as any)) {
        throw createError(400, `Missing required document for Postgraduate pathway: ${reqType}`);
      }
    }
  } else {
    if (docs.length === 0) {
      throw createError(
        400,
        'At least one document upload is required before submission.',
      );
    }
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

/**
 * Fetch all admission applications created by a specific applicant user.
 */
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
