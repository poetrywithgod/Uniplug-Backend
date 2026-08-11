export type AllowedRegistrationRole = 'applicant' | 'parent';

export interface RegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: AllowedRegistrationRole;
}

export interface VerifyOtpBody {
  email: string;
  otpCode: string;
}

export interface ResendOtpBody {
  email: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  isVerified: boolean;
  approvalStatus?: string | null;
  matricNumber?: string | null;
  staffId?: string | null;
  adminId?: string | null;
  level?: number | null;
  school?: string | null;
  schoolId?: string | null;
  tenantId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  faculty?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  programmeEnrollment?: {
    id: string;
    programmeId: string;
    programmeName: string;
    programmeCode: string;
    entryLevel: string;
    currentLevel: string;
    admissionPathway: string;
    status: string;
    isActive: boolean;
    startSession?: {
      id: string;
      name: string;
    } | null;
  } | null;
  activeSession?: {
    id: string;
    name: string;
  } | null;
  activeSemester?: {
    id: string;
    name: string;
  } | null;
}
