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
        const message = error.issues
          .map((issue) => {
            const path = issue.path.join('.');
            return path ? `Field '${path}': ${issue.message}` : issue.message;
          })
          .join('. ');
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
      const parsed = schema.parse(req.query);
      // Express 'req.query' has only a getter, so we must mutate the existing object
      // or redefine the property. Redefining is cleaner for whole-object replacement:
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((issue) => {
            const path = issue.path.join('.');
            return path ? `Field '${path}': ${issue.message}` : issue.message;
          })
          .join('. ');
        next(createError(400, message));
        return;
      }

      next(error);
    }
  };
};
