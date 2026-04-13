import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import {
  JWT_EXPIRES_IN,
  JWT_SECRET,
  OTP_EXPIRES_IN_MINUTES,
} from '../../configs/envConfig';

const DEFAULT_OTP_EXPIRY_MINUTES = 10;
const BCRYPT_ROUNDS = 12;

export const hashPassword = async (plainPassword: string): Promise<string> => {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

export const comparePassword = async (
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, passwordHash);
};

export const generateOtpCode = (): string => {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
};

export const hashOtpCode = (otpCode: string): string => {
  return crypto.createHash('sha256').update(otpCode).digest('hex');
};

export const getOtpExpiryDate = (): Date => {
  const expiryMinutes =
    Number(OTP_EXPIRES_IN_MINUTES) || DEFAULT_OTP_EXPIRY_MINUTES;
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

export const signAccessToken = (payload: {
  sub: string;
  role: string;
}): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const expiresIn = JWT_EXPIRES_IN || '1d';

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
};
