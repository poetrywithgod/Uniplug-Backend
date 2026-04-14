import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Uniplug API',
    version: '1.0.0',
    description:
      'API documentation for Uniplug authentication, tenant onboarding, and role approval governance.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Primary API base URL',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and OTP flows' },
    { name: 'SuperAdmin', description: 'Platform-level onboarding and school-admin governance' },
    { name: 'SchoolAdmin', description: 'School-admin staff onboarding and governance' },
    { name: 'Meta', description: 'Shared read-only metadata endpoints' },
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
        summary: 'Register applicant or parent',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'phoneNumber', 'password', 'role'],
                properties: {
                  firstName: { type: 'string', example: 'Jane' },
                  lastName: { type: 'string', example: 'Doe' },
                  email: { type: 'string', format: 'email', example: 'jane@uniplug.com' },
                  phoneNumber: { type: 'string', example: '+2348012345678' },
                  password: { type: 'string', example: 'Secure123' },
                  role: { type: 'string', enum: ['applicant', 'parent'], example: 'applicant' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Registration accepted, OTP sent' } },
      },
    },
    '/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otpCode'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'jane@uniplug.com' },
                  otpCode: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OTP verified and token issued' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'jane@uniplug.com' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          403: { description: 'Account not approved or not verified' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request reset OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'jane@uniplug.com' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Reset OTP flow started' } },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otpCode', 'newPassword'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'jane@uniplug.com' },
                  otpCode: { type: 'string', example: '123456' },
                  newPassword: { type: 'string', example: 'NewSecure123' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Password reset successful' } },
      },
    },
    '/super-admin/tenants': {
      post: {
        tags: ['SuperAdmin'],
        summary: 'Create tenant (school)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['schoolName', 'schoolId', 'email', 'school', 'address', 'postalCode'],
                properties: {
                  schoolName: { type: 'string', example: 'University of Lagos' },
                  schoolId: { type: 'string', example: 'UPH-009' },
                  email: { type: 'string', format: 'email', example: 'info@unilag.edu.ng' },
                  school: { type: 'string', example: 'Unilag' },
                  address: { type: 'string', example: '1 University Road, Akoka' },
                  postalCode: { type: 'string', example: '101017' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Tenant created' } },
      },
    },
    '/super-admin/school-admins': {
      post: {
        tags: ['SuperAdmin'],
        summary: 'Create school admin account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'schoolId', 'email', 'school', 'password'],
                properties: {
                  fullName: { type: 'string', example: 'Fatima Ibrahim' },
                  schoolId: { type: 'string', example: 'UPH-009' },
                  email: { type: 'string', format: 'email', example: 'demo@uniplug.com' },
                  school: { type: 'string', example: 'Uniport' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'School admin submitted (pending approval)' } },
      },
    },
    '/super-admin/school-admins/{userId}/verify': {
      patch: {
        tags: ['SuperAdmin'],
        summary: 'Verify school admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'School admin verified' } },
      },
    },
    '/super-admin/school-admins/{userId}/reject': {
      patch: {
        tags: ['SuperAdmin'],
        summary: 'Reject school admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  remark: { type: 'string', example: 'Incomplete compliance documents' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'School admin rejected' } },
      },
    },
    '/admin/lecturers': {
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create lecturer account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'staffId', 'email', 'department', 'password'],
                properties: {
                  fullName: { type: 'string', example: 'Samuel Okonkwo' },
                  staffId: { type: 'string', example: 'L-1002' },
                  email: { type: 'string', format: 'email', example: 'samuel@uniplug.com' },
                  department: { type: 'string', example: 'Computer Science' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Lecturer submitted (pending school-admin approval)' } },
      },
    },
    '/admin/hostel-admins': {
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create hostel admin account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'staffId', 'email', 'department', 'password'],
                properties: {
                  fullName: { type: 'string', example: 'Amaka Eze' },
                  staffId: { type: 'string', example: 'H-1002' },
                  email: { type: 'string', format: 'email', example: 'amaka@uniplug.com' },
                  department: { type: 'string', example: 'Hostel Operations' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Hostel admin submitted (pending school-admin approval)' } },
      },
    },
    '/admin/staff/{userId}/verify': {
      patch: {
        tags: ['SchoolAdmin'],
        summary: 'Verify lecturer/hostel admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Staff verified' } },
      },
    },
    '/admin/staff/{userId}/reject': {
      patch: {
        tags: ['SchoolAdmin'],
        summary: 'Reject lecturer/hostel admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  remark: { type: 'string', example: 'Invalid staff metadata' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Staff rejected' } },
      },
    },
    '/meta/departments': {
      get: {
        tags: ['Meta'],
        summary: 'Get Nigerian university departments',
        responses: { 200: { description: 'Departments list returned' } },
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
