import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Uniplug API',
    version: '1.0.0',
    description:
      'API documentation for Uniplug authentication, admin onboarding, and shared metadata services.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Primary API base URL',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication and account verification endpoints',
    },
    {
      name: 'Admin',
      description: 'Admin-only onboarding endpoints for staff accounts',
    },
    {
      name: 'Meta',
      description: 'Shared read-only metadata endpoints',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user account',
        description:
          'Creates an unverified account for applicant or parent role and sends OTP to email for verification.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'firstName',
                  'lastName',
                  'email',
                  'phoneNumber',
                  'password',
                  'role',
                ],
                properties: {
                  firstName: { type: 'string', example: 'Jane' },
                  lastName: { type: 'string', example: 'Doe' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'jane@uniplug.com',
                  },
                  phoneNumber: { type: 'string', example: '+2348012345678' },
                  password: { type: 'string', example: 'Secure123' },
                  role: {
                    type: 'string',
                    enum: ['applicant', 'parent'],
                    example: 'applicant',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration successful and OTP sent',
          },
          400: {
            description: 'Validation error',
          },
          409: {
            description: 'Email already registered',
          },
        },
      },
    },
    '/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify registration OTP',
        description:
          'Verifies the OTP sent to email and activates the account.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otpCode'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'jane@uniplug.com',
                  },
                  otpCode: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Account verified',
          },
          400: {
            description: 'Invalid or expired OTP',
          },
          404: {
            description: 'User not found',
          },
        },
      },
    },
    '/auth/resend-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Resend OTP code',
        description: 'Generates and sends a new OTP for unverified account.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'jane@uniplug.com',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OTP resent',
          },
          400: {
            description: 'Already verified or invalid request',
          },
          404: {
            description: 'User not found',
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        description:
          'Logs in a verified user and returns a signed access token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'jane@uniplug.com',
                  },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
          },
          401: {
            description: 'Invalid credentials',
          },
          403: {
            description: 'Account not verified',
          },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset OTP',
        description: 'Sends OTP to email for password reset if account exists.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'jane@uniplug.com',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Reset OTP process started',
          },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with OTP',
        description: 'Resets user password using valid OTP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otpCode', 'newPassword'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'jane@uniplug.com',
                  },
                  otpCode: { type: 'string', example: '123456' },
                  newPassword: { type: 'string', example: 'NewSecure123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password reset successful',
          },
          400: {
            description: 'Invalid or expired OTP',
          },
        },
      },
    },
    '/admin/lecturers': {
      post: {
        tags: ['Admin'],
        summary: 'Create lecturer account',
        description:
          'Creates lecturer account and emails login details + verification OTP.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'fullName',
                  'staffId',
                  'email',
                  'department',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Fatima Ibrahim' },
                  staffId: { type: 'string', example: 'Y-SKMS' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'fatima@uniplug.com',
                  },
                  department: { type: 'string', example: 'Microbiology' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Lecturer account created',
          },
          403: {
            description: 'Admin role required',
          },
        },
      },
    },
    '/admin/hostel-admins': {
      post: {
        tags: ['Admin'],
        summary: 'Create hostel admin account',
        description:
          'Creates hostel admin account and emails login details + verification OTP.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'fullName',
                  'staffId',
                  'email',
                  'department',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Fatima Ibrahim' },
                  staffId: { type: 'string', example: 'H-A112' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'hostel-admin@uniplug.com',
                  },
                  department: { type: 'string', example: 'Hostel Operations' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Hostel admin account created',
          },
          403: {
            description: 'Admin role required',
          },
        },
      },
    },
    '/meta/departments': {
      get: {
        tags: ['Meta'],
        summary: 'Get Nigerian university departments',
        description:
          'Returns a curated JSON list of Nigerian university academic departments.',
        responses: {
          200: {
            description: 'Departments list returned',
          },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.status(200).json(swaggerSpec);
  });
};
