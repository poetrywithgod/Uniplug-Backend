import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Uniplug API',
    version: '1.0.0',
    description:
      'API documentation for Uniplug authentication module. Registration requires OTP verification before login.',
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
  ],
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
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.status(200).json(swaggerSpec);
  });
};
