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
    {
      name: 'SuperAdmin',
      description: 'Platform-level onboarding and school-admin governance',
    },
    {
      name: 'SchoolAdmin',
      description: 'School-admin staff onboarding and governance',
    },
    { name: 'Meta', description: 'Shared read-only metadata endpoints' },
    {
      name: 'Application',
      description: 'Applicant admission application endpoints',
    },
    {
      name: 'Hostels',
      description: 'Hostel management and student application endpoints',
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
    // --- Application Endpoints ---
    '/application': {
      get: {
        tags: ['Application'],
        summary: 'Get all applications for the current applicant',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Applications retrieved successfully' },
        },
      },
      post: {
        tags: ['Application'],
        summary: 'Start a new application for a school',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['schoolId'],
                properties: {
                  schoolId: { type: 'string', example: 'UPH-009' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Application started successfully' },
          409: { description: 'Application already exists for this school' },
        },
      },
    },
    '/application/{applicationId}/personal-details': {
      patch: {
        tags: ['Application'],
        summary: 'Update personal details (Step 1)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'firstName',
                  'lastName',
                  'dateOfBirth',
                  'gender',
                  'phoneNumber',
                  'email',
                ],
                properties: {
                  firstName: { type: 'string', example: 'Jane' },
                  lastName: { type: 'string', example: 'Doe' },
                  dateOfBirth: { type: 'string', example: '2000-01-01' },
                  gender: {
                    type: 'string',
                    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
                  },
                  phoneNumber: { type: 'string', example: '+2348012345678' },
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
          200: { description: 'Personal details updated successfully' },
        },
      },
    },
    '/application/{applicationId}/academic-history': {
      patch: {
        tags: ['Application'],
        summary: 'Update academic history (Step 2)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'institution',
                  'highestQualification',
                  'graduationYear',
                  'overallGrade',
                ],
                properties: {
                  institution: {
                    type: 'string',
                    example: 'University of Lagos',
                  },
                  highestQualification: { type: 'string', example: 'BSc' },
                  graduationYear: { type: 'integer', example: 2022 },
                  overallGrade: { type: 'string', example: 'First Class' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Academic history updated successfully' },
        },
      },
    },
    '/application/{applicationId}/programme-selection': {
      patch: {
        tags: ['Application'],
        summary: 'Update programme selection (Step 3)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['faculty', 'course', 'studyMode'],
                properties: {
                  faculty: { type: 'string', example: 'Engineering' },
                  course: { type: 'string', example: 'Computer Engineering' },
                  studyMode: {
                    type: 'string',
                    enum: ['FULL_TIME', 'PART_TIME', 'DISTANCE_LEARNING'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Programme selection updated successfully' },
        },
      },
    },
    '/application/{applicationId}/documents/signature': {
      post: {
        tags: ['Application'],
        summary: 'Get Cloudinary signature for document upload (Step 4a)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['documentType', 'fileName'],
                properties: {
                  documentType: {
                    type: 'string',
                    enum: [
                      'TRANSCRIPT',
                      'ID_PASSPORT',
                      'PASSPORT_PHOTOGRAPH',
                      'CERTIFICATE',
                    ],
                  },
                  fileName: { type: 'string', example: 'transcript.pdf' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cloudinary signature generated successfully' },
        },
      },
    },
    '/application/{applicationId}/documents': {
      post: {
        tags: ['Application'],
        summary: 'Save uploaded document details to application (Step 4b)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['documentType', 'fileUrl'],
                properties: {
                  documentType: {
                    type: 'string',
                    enum: [
                      'TRANSCRIPT',
                      'ID_PASSPORT',
                      'PASSPORT_PHOTOGRAPH',
                      'CERTIFICATE',
                    ],
                  },
                  fileUrl: {
                    type: 'string',
                    format: 'url',
                    example:
                      'https://res.cloudinary.com/demo/image/upload/v1234567890/applications/123/TRANSCRIPT.pdf',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Document added to application successfully' },
        },
      },
    },
    '/application/{applicationId}/submit': {
      post: {
        tags: ['Application'],
        summary: 'Submit application (Step 5)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Application submitted successfully' },
        },
      },
    },
    // --- End Application Endpoints ---

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
                  email: {
                    type: 'string',
                    description:
                      'Can be either an email address or an Admin ID',
                    example: 'jane@uniplug.com (or UPH-J-1239)',
                  },
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
        summary: 'Request password reset link',
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
          200: { description: 'Password reset link sent to email' },
        },
      },
    },
    '/auth/reset-password/{token}': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password via email token',
        parameters: [
          {
            name: 'token',
            in: 'path',
            required: true,
            description: 'Reset token received via email link',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['newPassword'],
                properties: {
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
      get: {
        tags: ['SuperAdmin'],
        summary: 'List all tenants (schools)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Tenants retrieved successfully' },
        },
      },
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
                required: [
                  'schoolName',
                  'email',
                  'address',
                  'postalCode',
                ],
                properties: {
                  schoolName: {
                    type: 'string',
                    example: 'University of Lagos',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'info@unilag.edu.ng',
                  },
                  school: {
                    type: 'string',
                    description: 'Short school/display name (optional, derived from schoolName if omitted)',
                    example: 'Unilag',
                  },
                  address: {
                    type: 'string',
                    example: '1 University Road, Akoka',
                  },
                  postalCode: { type: 'string', example: '101017' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Tenant created' } },
      },
    },
    '/super-admin/tenants/{tenantId}/school-admins': {
      get: {
        tags: ['SuperAdmin'],
        summary: 'List all school admins for a particular school tenant',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tenantId',
            in: 'path',
            required: true,
            description: 'Tenant MongoDB ID or string schoolId (e.g. UPH-009)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'School admins retrieved successfully' },
          404: { description: 'Tenant not found' },
        },
      },
    },
    '/super-admin/school-admins': {
      get: {
        tags: ['SuperAdmin'],
        summary: 'List all school admins in the system',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'All school admins retrieved successfully',
          },
        },
      },
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
                required: [
                  'fullName',
                  'schoolId',
                  'email',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Fatima Ibrahim' },
                  schoolId: { type: 'string', example: 'UPH-009' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'demo@uniplug.com',
                  },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'School admin submitted (pending approval)' },
        },
      },
    },
    '/super-admin/school-admins/{userId}/verify': {
      patch: {
        tags: ['SuperAdmin'],
        summary: 'Verify school admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'School admin verified' } },
      },
    },
    '/super-admin/school-admins/{userId}/reject': {
      patch: {
        tags: ['SuperAdmin'],
        summary: 'Reject school admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  remark: {
                    type: 'string',
                    example: 'Incomplete compliance documents',
                  },
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
                required: [
                  'fullName',
                  'staffId',
                  'email',
                  'department',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Samuel Okonkwo' },
                  staffId: { type: 'string', example: 'L-1002' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'samuel@uniplug.com',
                  },
                  department: { type: 'string', example: 'Computer Science' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Lecturer submitted (pending school-admin approval)',
          },
        },
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
                required: [
                  'fullName',
                  'staffId',
                  'email',
                  'department',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Amaka Eze' },
                  staffId: { type: 'string', example: 'H-1002' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'amaka@uniplug.com',
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
            description:
              'Hostel admin submitted (pending school-admin approval)',
          },
        },
      },
    },
    '/admin/staff/{userId}/verify': {
      patch: {
        tags: ['SchoolAdmin'],
        summary: 'Verify lecturer/hostel admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'Staff verified' } },
      },
    },
    '/admin/staff/{userId}/reject': {
      patch: {
        tags: ['SchoolAdmin'],
        summary: 'Reject lecturer/hostel admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
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
    '/admin/applications': {
      get: {
        tags: ['SchoolAdmin'],
        summary: 'List and filter applications for the school',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number', default: 10 },
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'NOT_STARTED',
                'DRAFT',
                'SUBMITTED',
                'UNDER_REVIEW',
                'APPROVED',
                'REJECTED',
              ],
            },
          },
          { name: 'program', in: 'query', schema: { type: 'string' } },
          { name: 'session', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description:
              'Target applications retrieved successfully with full application records, applicant details, and school data',
          },
        },
      },
    },
    '/admin/applications/{applicationId}/status': {
      patch: {
        tags: ['SchoolAdmin'],
        summary: 'Update application status (e.g., Approve / Reject)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
                  },
                  rejectionReason: {
                    type: 'string',
                    description: 'Required strictly when status is REJECTED',
                    example: 'O-Level results do not meet criteria.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Application status correctly updated' },
        },
      },
    },
    '/meta/departments': {
      get: {
        tags: ['Meta'],
        summary: 'Get Nigerian university departments',
        responses: { 200: { description: 'Departments list returned' } },
      },
    },
    // --- Hostel Endpoints ---
    '/hostels': {
      post: {
        tags: ['Hostels'],
        summary: 'Create a new hostel (HOSTEL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'name',
                  'type',
                  'capacity',
                  'price',
                  'totalRooms',
                  'totalBlocks',
                  'totalWings',
                  'spacePerRoom',
                ],
                properties: {
                  name: { type: 'string', example: 'Amina Hall' },
                  type: { type: 'string', enum: ['MALE', 'FEMALE', 'MIXED'] },
                  capacity: { type: 'integer', example: 500 },
                  price: { type: 'number', example: 120000 },
                  totalRooms: { type: 'integer', example: 100 },
                  totalBlocks: { type: 'integer', example: 2 },
                  totalWings: { type: 'integer', example: 4 },
                  spacePerRoom: { type: 'integer', example: 5 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Hostel created successfully' },
        },
      },
      get: {
        tags: ['Hostels'],
        summary: 'Get all hostels for the tenant (HOSTEL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Hostels retrieved successfully' },
        },
      },
    },
    '/hostels/available': {
      get: {
        tags: ['Hostels'],
        summary:
          "Get all available hostels in the student's school (STUDENT only)",
        description:
          'Retrieve a list of all hostels with available spaces. Students can use this to browse hostels before applying. Returns hostel details including name, type, capacity, available spaces, and pricing information.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Available hostels retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', description: 'Hostel ID' },
                          name: { type: 'string', example: 'Amina Hall' },
                          type: {
                            type: 'string',
                            enum: ['MALE', 'FEMALE', 'MIXED'],
                            example: 'FEMALE',
                          },
                          capacity: { type: 'integer', example: 500 },
                          price: { type: 'number', example: 120000 },
                          availableSpaces: {
                            type: 'integer',
                            example: 250,
                            description: 'Number of spaces available',
                          },
                          totalRooms: { type: 'integer', example: 100 },
                          totalBlocks: { type: 'integer', example: 2 },
                          totalWings: { type: 'integer', example: 4 },
                          spacePerRoom: { type: 'integer', example: 5 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          403: {
            description:
              'Unauthorized - Only students can access this endpoint',
          },
        },
      },
    },
    '/hostels/{id}': {
      put: {
        tags: ['Hostels'],
        summary: 'Update a hostel (HOSTEL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  capacity: { type: 'integer' },
                  price: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Hostel updated successfully' },
        },
      },
      delete: {
        tags: ['Hostels'],
        summary: 'Delete a hostel (HOSTEL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          204: { description: 'Hostel deleted successfully' },
        },
      },
    },
    '/hostels/{id}/apply': {
      post: {
        tags: ['Hostels'],
        summary: 'Apply for a space in a hostel (STUDENT only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          201: { description: 'Application submitted successfully' },
        },
      },
    },
    '/hostels/{id}/applications': {
      get: {
        tags: ['Hostels'],
        summary: 'Get applications for a hostel (HOSTEL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Applications retrieved successfully' },
        },
      },
    },
    '/hostels/applications/{id}/review': {
      patch: {
        tags: ['Hostels'],
        summary: 'Review an application (HOSTEL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['APPROVED', 'REJECTED'] },
                  rejectionReason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Application reviewed successfully' },
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
