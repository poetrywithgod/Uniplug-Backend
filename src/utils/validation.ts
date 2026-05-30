import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';

import createError from 'http-errors';

export const validateRequest = (schema: ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((issue) => issue.message).join('. ');
        next(createError(400, message));
        return;
      }

      next(error);
    }
  };
};

export const validateQuery = (schema: ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Cast to 'any' to satisfy Express's ParsedQs type constraint
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((issue) => issue.message).join('. ');
        next(createError(400, message));
        return;
      }

      next(error);
    }
  };
};
