import express, { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import cors from 'cors';

import adminRoutes from './modules/admin/adminRoute';
import authRoutes from './modules/auth/authRoute';
import metaRoutes from './modules/meta/metaRoute';
import superAdminRoutes from './modules/superAdmin/superAdminRoute';
import applicationRoutes from './modules/application/applicationRoute';
import catchAll404Errors from './middlewares/catchAll404Errors';
import globalErrorHandler from './middlewares/errorHandler';
import { healthCheck } from './utils/health';
import { connectDatabase } from './configs/prismaConfig';
import { rateLimiter } from './configs/rateLimitConfig';
import { setupSwagger } from './configs/swaggerConfig';

import './configs/sentryConfig';

const app = express();

// connect to DB
connectDatabase();

// Rate limiting - Apply to all requests
app.use(rateLimiter);

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
setupSwagger(app);

// Routes
app.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send({
    status: 'success',
    name: 'Uniplug API',
    version: 'v1',
    description:
      'Backend API for Uniplug authentication, multi-tenant onboarding, school-admin governance, and shared metadata services.',
    health: '/health',
    baseUrl: '/api/v1',
    docs: '/api-docs',
    endpoints: {
      auth: '/api/v1/auth',
      superAdmin: '/api/v1/super-admin',
      schoolAdmin: '/api/v1/admin',
      meta: '/api/v1/meta',
      application: '/api/v1/application',
    },
  });
});

app.use('/health', healthCheck);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/meta', metaRoutes);
app.use('/api/v1/application', applicationRoutes);

app.get('/debug-sentry', (req, res) => {
  throw new Error('My first Sentry error!');
});

// Error handlers
Sentry.setupExpressErrorHandler(app); // sentry error handler middleware

app.use(catchAll404Errors); // Catch all 404 errors...

app.use(globalErrorHandler); // Catch all errors...

export default app;
