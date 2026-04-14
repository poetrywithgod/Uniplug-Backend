import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';

import prisma from '../configs/prismaConfig';
import { verifyAccessToken } from '../modules/auth/authSecurity';

type AllowedRole =
  | 'ADMIN'
  | 'APPLICANT'
  | 'PARENT'
  | 'LECTURER'
  | 'HOSTEL_ADMIN';

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
      select: { id: true, email: true, role: true, isVerified: true },
    });

    if (!user) {
      return next(createError(401, 'Invalid authentication token.'));
    }

    res.locals.user = user;
    next();
  } catch (_error) {
    return next(createError(401, 'Invalid or expired authentication token.'));
  }
};

export const requireRole = (...roles: AllowedRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = res.locals.user as { role?: AllowedRole } | undefined;

    if (!user?.role || !roles.includes(user.role)) {
      return next(
        createError(403, 'You do not have permission to perform this action.'),
      );
    }

    next();
  };
};
