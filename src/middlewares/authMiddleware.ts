import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';

import prisma from '../configs/prismaConfig';
import { verifyAccessToken } from '../modules/auth/authSecurity';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  ADMISSION_OFFICER: 'ADMISSION_OFFICER',
  HOD: 'HOD',
  LECTURER: 'LECTURER',
  EXAMINATION_OFFICER: 'EXAMINATION_OFFICER',
  FINANCE_OFFICER: 'FINANCE_OFFICER',
  HOSTEL_MANAGER: 'HOSTEL_MANAGER',
  HOSTEL_STAFF: 'HOSTEL_STAFF',
  STUDENT: 'STUDENT',
  APPLICANT: 'APPLICANT',
  PARENT: 'PARENT',
} as const;

export type AllowedRole = keyof typeof ROLES;

const getBearerToken = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return next(createError(401, 'Authentication required.'));
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        approvalStatus: true,
        tenantId: true,
        schoolId: true,
        school: true,
        departmentId: true,
      },
    });

    if (!user) {
      return next(createError(401, 'Invalid authentication token.'));
    }

    const requiresApproval =
      user.role === 'SCHOOL_ADMIN' ||
      user.role === 'LECTURER' ||
      user.role === 'HOSTEL_MANAGER' ||
      user.role === 'HOD' ||
      user.role === 'FINANCE_OFFICER' ||
      user.role === 'EXAMINATION_OFFICER' ||
      user.role === 'HOSTEL_STAFF';

    if (requiresApproval && user.approvalStatus !== 'VERIFIED') {
      return next(
        createError(
          403,
          'Account approval is required before performing this operation.',
        ),
      );
    }

    res.locals.user = user;
    next();
  } catch (_error) {
    return next(createError(401, 'Invalid or expired authentication token.'));
  }
};

type RoleOrGroup = AllowedRole | readonly AllowedRole[] | AllowedRole[];

export const requireRole = (...roles: RoleOrGroup[]) => {
  const allowedSet = new Set<string>();

  for (const item of roles) {
    if (Array.isArray(item)) {
      for (const r of item) {
        allowedSet.add(r);
      }
    } else if (typeof item === 'string') {
      allowedSet.add(item);
    }
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const user = res.locals.user as { role?: AllowedRole } | undefined;

    if (!user?.role || !allowedSet.has(user.role)) {
      return next(
        createError(403, 'You do not have permission to perform this action.'),
      );
    }

    next();
  };
};

export const requireAccessGroup = (
  group: readonly AllowedRole[] | AllowedRole[],
) => {
  return requireRole(group);
};
