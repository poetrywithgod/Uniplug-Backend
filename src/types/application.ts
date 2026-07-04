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
  faculty: string;
  course: string;
  studyMode: 'FULL_TIME' | 'PART_TIME' | 'DISTANCE_LEARNING';
  admissionPathway: 'UNDERGRADUATE' | 'DIRECT_ENTRY' | 'PART_TIME' | 'POSTGRADUATE';
}

export interface DocumentSignatureBody {
  documentType:
    | 'TRANSCRIPT'
    | 'ID_PASSPORT'
    | 'PASSPORT_PHOTOGRAPH'
    | 'CERTIFICATE'
    | 'JAMB_RESULT'
    | 'BIRTH_CERTIFICATE'
    | 'LGA_CERTIFICATE'
    | 'CV'
    | 'STATEMENT_OF_PURPOSE';
  fileName: string;
}

export interface AddDocumentBody {
  documentType:
    | 'TRANSCRIPT'
    | 'ID_PASSPORT'
    | 'PASSPORT_PHOTOGRAPH'
    | 'CERTIFICATE'
    | 'JAMB_RESULT'
    | 'BIRTH_CERTIFICATE'
    | 'LGA_CERTIFICATE'
    | 'CV'
    | 'STATEMENT_OF_PURPOSE';
  fileUrl: string;
}

