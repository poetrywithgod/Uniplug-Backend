export interface StartApplicationBody {
  schoolId: string;
}

export interface PersonalDetailsBody {
  firstName: string;
  lastName: string;
  dateOfBirth: Date; // Transformed from ISO string
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  phoneNumber: string;
  email: string;
}

export interface AcademicHistoryBody {
  institution: string;
  highestQualification: string;
  graduationYear: number;
  overallGrade: string;
}

export interface ProgrammeSelectionBody {
  facultyId: string;
  departmentId: string;
  studyMode: 'FULL_TIME' | 'PART_TIME' | 'DISTANCE_LEARNING';
  admissionPathway: 'UNDERGRADUATE' | 'DIRECT_ENTRY' | 'PART_TIME' | 'POSTGRADUATE';
}

export type DocumentTypeUnion =
  | 'OLEVEL_RESULT'
  | 'HIGHER_QUALIFICATION_CERTIFICATE'
  | 'TRANSCRIPT'
  | 'JAMB_RESULT'
  | 'PASSPORT_PHOTOGRAPH'
  | 'BIRTH_CERTIFICATE'
  | 'LGA_CERTIFICATE'
  | 'ID_PASSPORT'
  | 'NYSC_CERTIFICATE'
  | 'CV'
  | 'STATEMENT_OF_PURPOSE'
  | 'REFERENCE_LETTERS'
  | 'CERTIFICATE';

export interface DocumentSignatureBody {
  documentType: DocumentTypeUnion;
  fileName: string;
}

export interface AddDocumentBody {
  documentType: DocumentTypeUnion;
  fileUrl: string;
}

