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
  email: string;
  otpCode: string;
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
  staffId?: string | null;
  department?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
