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
import { generateOfferLetterPDF } from '../../utils/pdfGenerator';
import { sendOfferAcceptedEmailWithAttachment } from '../../utils/email';
import { generateMatricNumber } from '../../utils/helpers';



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

  // Lookup Faculty & Department to validate and store resolved names for display/PDF generation
  const facultyRecord = await prisma.faculty.findFirst({
    where: { id: payload.facultyId, tenantId: application.schoolId },
  });

  if (!facultyRecord) {
    throw createError(404, 'Faculty not found.');
  }

  const departmentRecord = await prisma.department.findFirst({
    where: { id: payload.departmentId, tenantId: application.schoolId },
  });

  if (!departmentRecord) {
    throw createError(404, 'Department not found.');
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      programmeSelection: {
        facultyId: payload.facultyId,
        departmentId: payload.departmentId,
        faculty: facultyRecord.name,
        course: departmentRecord.name,
        studyMode: payload.studyMode,
        admissionPathway: payload.admissionPathway,
      },
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

  const pathway = application.programmeSelection.admissionPathway || '';
  const docs = application.documents || [];
  const uploadedTypes = docs.map((d) => d.documentType);

  const REQUIRED_DOCUMENTS_BY_PATHWAY: Record<string, string[]> = {
    UNDERGRADUATE: [
      'OLEVEL_RESULT',
      'JAMB_RESULT',
      'PASSPORT_PHOTOGRAPH',
      'BIRTH_CERTIFICATE',
      'LGA_CERTIFICATE',
    ],
    DIRECT_ENTRY: [
      'OLEVEL_RESULT',
      'HIGHER_QUALIFICATION_CERTIFICATE',
      'TRANSCRIPT',
      'JAMB_RESULT',
      'PASSPORT_PHOTOGRAPH',
      'BIRTH_CERTIFICATE',
      'LGA_CERTIFICATE',
    ],
    PART_TIME: [
      'OLEVEL_RESULT',
      'JAMB_RESULT',
      'PASSPORT_PHOTOGRAPH',
      'BIRTH_CERTIFICATE',
      'LGA_CERTIFICATE',
    ],
    POSTGRADUATE: [
      'TRANSCRIPT',
      'ID_PASSPORT',
      'NYSC_CERTIFICATE',
      'CV',
      'STATEMENT_OF_PURPOSE',
      'REFERENCE_LETTERS',
      'PASSPORT_PHOTOGRAPH',
    ],
  };

  const required = REQUIRED_DOCUMENTS_BY_PATHWAY[pathway];
  if (required) {
    const missing = required.filter((reqType: string) => !uploadedTypes.includes(reqType as any));
    if (missing.length > 0) {
      throw createError(
        400,
        `Missing required document(s) for ${pathway} pathway: ${missing.join(', ')}`,
      );
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

/**
 * Fetch the active admission offer for the authenticated applicant.
 */
export const getApplicantOffer = async (applicantId: string) => {
  const offer = await prisma.admissionOffer.findFirst({
    where: { applicantId },
    include: {
      application: {
        select: {
          id: true,
          applicationNumber: true,
          status: true,
          session: true,
          programmeSelection: true,
        },
      },
      tenant: {
        select: {
          id: true,
          schoolName: true,
          schoolId: true,
        },
      },
      issuedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!offer) {
    throw createError(404, 'No admission offer found for this account.');
  }

  return offer;
};

/**
 * Accept an Admission Offer: Auto-generates Matriculation Number, promotes user to STUDENT,
 * generates PDF Offer Letter, uploads to Cloudinary, and sends congratulatory email with attachment.
 */
export const acceptAdmissionOffer = async (offerId: string, applicantId: string) => {
  const offer = await prisma.admissionOffer.findUnique({
    where: { id: offerId },
    include: {
      application: {
        include: {
          applicant: true,
          school: true,
        },
      },
      issuedBy: true,
    },
  });

  if (!offer) {
    throw createError(404, 'Admission offer not found.');
  }

  if (offer.applicantId !== applicantId) {
    throw createError(403, 'You do not have permission to accept this offer.');
  }

  if (offer.status === 'ACCEPTED') {
    throw createError(400, 'You have already accepted this admission offer.');
  }

  if (offer.status === 'DECLINED') {
    throw createError(400, 'This admission offer was previously declined.');
  }

  if (offer.expiresAt && new Date() > new Date(offer.expiresAt)) {
    await prisma.admissionOffer.update({
      where: { id: offerId },
      data: { status: 'EXPIRED' },
    });
    throw createError(400, 'This admission offer has expired.');
  }

  // 1. Auto-generate Matriculation Number (e.g. UOL/PHY/2027/0001 format)
  const studentCount = await prisma.user.count({
    where: {
      tenantId: offer.tenantId,
      role: 'STUDENT',
    },
  });

  const matricNumber = generateMatricNumber(
    offer.application.school.schoolId,
    offer.application.school.schoolName,
    offer.offeredCourse,
    studentCount + 1,
    offer.application.session || '2027/2028'
  );


  // 2. Determine Entry Level & Promote Applicant to STUDENT & Assign Matric No
  const pathway = offer.application.programmeSelection?.admissionPathway || '';
  const isDE =
    pathway.trim().toLowerCase().includes('direct') ||
    pathway.trim().toLowerCase().includes('de') ||
    pathway.trim().toLowerCase().includes('conversion') ||
    pathway.trim().toLowerCase().includes('hnd');
  const startingLevelNum = isDE ? 200 : 100;
  const startingLevelStr = `${startingLevelNum} Level`;

  const updatedUser = await prisma.user.update({
    where: { id: applicantId },
    data: {
      staffId: matricNumber,
      adminId: matricNumber,
      role: 'STUDENT',
      isVerified: true,
      approvalStatus: 'VERIFIED',
      level: startingLevelNum,
      departmentId: offer.offeredDepartmentId || null,
      schoolId: offer.application.school.schoolId,
      school: offer.application.school.schoolName,
      tenantId: offer.tenantId,
    },
  });

  // Automatically create/update ProgrammeEnrollment for the new student
  let programme = await prisma.programme.findFirst({
    where: {
      tenantId: offer.tenantId,
      OR: [
        { name: { contains: offer.offeredCourse, mode: 'insensitive' } },
        { departmentId: offer.offeredDepartmentId || undefined },
      ],
    },
  });

  if (!programme && offer.offeredDepartmentId) {
    programme = await prisma.programme.findFirst({
      where: { tenantId: offer.tenantId, departmentId: offer.offeredDepartmentId },
    });
  }

  let academicSession = await prisma.academicSession.findFirst({
    where: {
      tenantId: offer.tenantId,
      name: offer.application.session || undefined,
    },
  });

  if (!academicSession) {
    academicSession = await prisma.academicSession.findFirst({
      where: { tenantId: offer.tenantId, isActive: true },
    });
  }

  if (programme && academicSession) {
    const existingEnrollment = await prisma.programmeEnrollment.findFirst({
      where: {
        studentId: applicantId,
        tenantId: offer.tenantId,
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
          studentId: applicantId,
          programmeId: programme.id,
          startSessionId: academicSession.id,
          entryLevel: startingLevelStr,
          currentLevel: startingLevelStr,
          admissionPathway: pathway || (isDE ? 'Direct Entry' : 'UTME'),
          isActive: true,
          status: 'ACTIVE',
          tenantId: offer.tenantId,
        },
      });
    }
  }

  // 3. Generate Official PDF Offer Letter
  const officerName = `${offer.issuedBy.firstName} ${offer.issuedBy.lastName}`;
  const pdfResult = await generateOfferLetterPDF({
    applicantName: `${updatedUser.firstName} ${updatedUser.lastName}`,
    applicantEmail: updatedUser.email,
    applicationNumber: offer.application.applicationNumber || 'N/A',
    matricNumber,
    schoolName: offer.application.school.schoolName,
    session: offer.application.session || '2027/2028',
    offeredCourse: offer.offeredCourse,
    offeredFaculty: offer.offeredFaculty,
    originalCourse: offer.originalCourse,
    isAlternativeOffer: offer.isAlternativeOffer,
    remarks: offer.remarks,
    issuedByOfficer: officerName,
    dateIssued: offer.createdAt,
  });

  // 4. Update AdmissionOffer & Application status
  const acceptedAt = new Date();
  const updatedOffer = await prisma.admissionOffer.update({
    where: { id: offerId },
    data: {
      status: 'ACCEPTED',
      acceptedAt,
      offerLetterUrl: pdfResult.fileUrl,
    },
  });

  await prisma.application.update({
    where: { id: offer.applicationId },
    data: {
      status: 'APPROVED',
      session: offer.application.session || '2027/2028',
    },
  });

  // 5. Send Congratulatory Email with PDF Attachment
  if (updatedUser.email) {
    await sendOfferAcceptedEmailWithAttachment({
      email: updatedUser.email,
      applicantName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      schoolName: offer.application.school.schoolName,
      offeredCourse: offer.offeredCourse,
      matricNumber,
      pdfBuffer: pdfResult.pdfBuffer,
    });
  }

  return {
    message: 'Admission offer accepted successfully! Congratulations on your admission.',
    matricNumber,
    offerLetterUrl: pdfResult.fileUrl,
    offer: updatedOffer,
  };
};

/**
 * Decline an Admission Offer.
 */
export const declineAdmissionOffer = async (
  offerId: string,
  applicantId: string,
  declineReason?: string
) => {
  const offer = await prisma.admissionOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    throw createError(404, 'Admission offer not found.');
  }

  if (offer.applicantId !== applicantId) {
    throw createError(403, 'You do not have permission to decline this offer.');
  }

  if (offer.status === 'ACCEPTED') {
    throw createError(400, 'Cannot decline an offer that has already been accepted.');
  }

  const declinedAt = new Date();
  const updatedOffer = await prisma.admissionOffer.update({
    where: { id: offerId },
    data: {
      status: 'DECLINED',
      declinedAt,
      declineReason: declineReason || null,
    },
  });

  await prisma.application.update({
    where: { id: offer.applicationId },
    data: { status: 'OFFER_DECLINED' },
  });

  return {
    message: 'Admission offer declined.',
    offer: updatedOffer,
  };
};

