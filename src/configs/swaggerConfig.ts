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
    {
      name: 'CourseManagement',
      description: 'Academic departments, courses, offerings, assignments, enrollments, and grading',
    },
    {
      name: 'Finance',
      description: 'Bursary & Finance operations: fee structures, payment ledger, manual reconciliation, refunds, and financial clearance',
    },
    {
      name: 'ExamRecords',
      description: 'Registry & Exam Records operations: result moderation, Senate publishing, graduation degree audits, transcript issuance, and verification',
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
                required: ['facultyId', 'departmentId', 'studyMode', 'admissionPathway'],
                properties: {
                  facultyId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  departmentId: { type: 'string', example: '507f1f77bcf86cd799439012' },
                  studyMode: {
                    type: 'string',
                    enum: ['FULL_TIME', 'PART_TIME', 'DISTANCE_LEARNING'],
                  },
                  admissionPathway: { type: 'string', example: 'UTME' },
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
                      'OLEVEL_RESULT',
                      'HIGHER_QUALIFICATION_CERTIFICATE',
                      'TRANSCRIPT',
                      'JAMB_RESULT',
                      'PASSPORT_PHOTOGRAPH',
                      'BIRTH_CERTIFICATE',
                      'LGA_CERTIFICATE',
                      'ID_PASSPORT',
                      'NYSC_CERTIFICATE',
                      'CV',
                      'STATEMENT_OF_PURPOSE',
                      'REFERENCE_LETTERS',
                      'REFERENCE_LETTER',
                      'CERTIFICATE',
                      'OTHER',
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
                      'OLEVEL_RESULT',
                      'HIGHER_QUALIFICATION_CERTIFICATE',
                      'TRANSCRIPT',
                      'JAMB_RESULT',
                      'PASSPORT_PHOTOGRAPH',
                      'BIRTH_CERTIFICATE',
                      'LGA_CERTIFICATE',
                      'ID_PASSPORT',
                      'NYSC_CERTIFICATE',
                      'CV',
                      'STATEMENT_OF_PURPOSE',
                      'REFERENCE_LETTERS',
                      'REFERENCE_LETTER',
                      'CERTIFICATE',
                      'OTHER',
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
                  'email',
                  'departmentId',
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
                  departmentId: { type: 'string', example: '60d5ec4b868e5a2b3479427d' },
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
      get: {
        tags: ['SchoolAdmin'],
        summary: 'Get all lecturers in the tenant school sorted by department (SCHOOL_ADMIN and HOD)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'departmentId', in: 'query', schema: { type: 'string' }, description: 'Filter lecturers by department ID' },
        ],
        responses: {
          200: { description: 'Lecturers retrieved successfully' },
        },
      },
    },
    '/admin/students': {
      get: {
        tags: ['SchoolAdmin'],
        summary: 'Get all admitted students in the school (SCHOOL_ADMIN, ADMISSION_OFFICER, HOD)',
        description: 'For HODs, this automatically filters and displays only students enrolled in their department.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'programmeId', in: 'query', schema: { type: 'string' } },
          { name: 'session', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Admitted students retrieved successfully' },
        },
      },
    },
    '/admin/departments/{departmentId}/hod': {
      patch: {
        tags: ['SchoolAdmin'],
        summary: 'Assign or reassign an HOD to a department (SCHOOL_ADMIN only)',
        description: 'Enforces that a user can only be the HOD of one department. Promotes them to HOD role and demotes the previous HOD to LECTURER.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'departmentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['hodId'],
                properties: {
                  hodId: { type: 'string', example: '60d5ec4b868e5a2b3479428a' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'HOD assigned successfully' },
          400: { description: 'Constraint violation (user is already HOD of another department)' },
        },
      },
      delete: {
        tags: ['SchoolAdmin'],
        summary: 'Remove the HOD from a department (SCHOOL_ADMIN only)',
        description: 'Clears the HOD association and demotes the user back to LECTURER.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'departmentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'HOD removed successfully' },
        },
      },
    },
    '/admin/hostel-admins': {
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create hostel manager account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'fullName',
                  'email',
                  'departmentId',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Amaka Obi' },
                  staffId: { type: 'string', example: 'H-1002' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'amaka@uniplug.com',
                  },
                  departmentId: { type: 'string', example: '60d5ec4b868e5a2b3479427d' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Hostel manager created successfully',
          },
        },
      },
    },
    '/admin/hods': {
      get: {
        tags: ['SchoolAdmin'],
        summary: 'Get all HODs in the school (SCHOOL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'HODs retrieved successfully' },
        },
      },
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create HOD account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'fullName',
                  'email',
                  'departmentId',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Professor John Doe' },
                  staffId: { type: 'string', example: 'HOD-1001' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'johndoe@uniplug.com',
                  },
                  departmentId: { type: 'string', example: '60d5ec4b868e5a2b3479427d' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'HOD created successfully',
          },
        },
      },
    },
    '/admin/admission-officers': {
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create Admission Officer account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'fullName',
                  'email',
                  'departmentId',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Chidi Benson' },
                  staffId: { type: 'string', example: 'ADM-2001' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'chidi@uniplug.com',
                  },
                  departmentId: { type: 'string', example: '60d5ec4b868e5a2b3479427d' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Admission Officer created successfully',
          },
        },
      },
    },
    '/admin/examination-officers': {
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create Examination Officer account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'fullName',
                  'email',
                  'departmentId',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Fatima Audu' },
                  staffId: { type: 'string', example: 'EXM-3001' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'fatima@uniplug.com',
                  },
                  departmentId: { type: 'string', example: '60d5ec4b868e5a2b3479427d' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Examination Officer created successfully',
          },
        },
      },
    },
    '/admin/finance-officers': {
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create Finance Officer account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'fullName',
                  'email',
                  'departmentId',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Tunde Yusuf' },
                  staffId: { type: 'string', example: 'FIN-4001' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'tunde@uniplug.com',
                  },
                  departmentId: { type: 'string', example: '60d5ec4b868e5a2b3479427d' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Finance Officer created successfully',
          },
        },
      },
    },
    '/admin/hostel-staff': {
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create Hostel Staff account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'fullName',
                  'email',
                  'departmentId',
                  'password',
                ],
                properties: {
                  fullName: { type: 'string', example: 'Mercy John' },
                  staffId: { type: 'string', example: 'HOS-5001' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'mercy@uniplug.com',
                  },
                  departmentId: { type: 'string', example: '60d5ec4b868e5a2b3479427d' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Hostel Staff created successfully',
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
    '/admin/sessions': {
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create a new academic session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: '2025/2026' },
                  isActive: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Session created successfully' },
        },
      },
      get: {
        tags: ['SchoolAdmin'],
        summary: 'Get all academic sessions and semesters for the tenant (Open to all authenticated roles)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Sessions list retrieved successfully' },
        },
      },
    },
    '/admin/sessions/{id}/activate': {
      patch: {
        tags: ['SchoolAdmin'],
        summary: 'Activate an academic session',
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
          200: { description: 'Session activated successfully' },
        },
      },
    },
    '/admin/sessions/{sessionId}/semesters': {
      post: {
        tags: ['SchoolAdmin'],
        summary: 'Create a new semester under a session',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'sessionId',
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
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'First Semester' },
                  isActive: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Semester created successfully' },
        },
      },
    },
    '/admin/semesters/{id}/activate': {
      patch: {
        tags: ['SchoolAdmin'],
        summary: 'Activate a semester under its session',
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
          200: { description: 'Semester activated successfully' },
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
    '/meta/transcripts/verify/{code}': {
      get: {
        tags: ['Meta'],
        summary: 'Public verification of official academic transcript by verification code',
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: 'Official transcript verification code' },
        ],
        responses: {
          200: { description: 'Transcript verified successfully with integrity verification hash' },
          404: { description: 'Transcript not found or invalid verification code' },
        },
      },
    },
    '/media/upload-signature': {
      get: {
        tags: ['Media'],
        summary: 'Generate secure Cloudinary upload signature (Universal)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'folder', in: 'query', schema: { type: 'string', default: 'general' }, description: 'Destination folder name in Cloudinary' },
        ],
        responses: {
          200: {
            description: 'Cloudinary upload signature generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Cloudinary upload signature generated successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        signature: { type: 'string', example: '85e94b23f...' },
                        timestamp: { type: 'integer', example: 17221789 },
                        folder: { type: 'string', example: 'general' },
                        cloudName: { type: 'string', example: 'cloudName' },
                        apiKey: { type: 'string', example: '1234567890' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
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
                  pictures: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['https://res.cloudinary.com/demo/image/upload/v1234/hostel1.jpg']
                  },
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
                  pictures: {
                    type: 'array',
                    items: { type: 'string' }
                  },
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
    // --- Course Management Endpoints ---
    '/departments': {
      post: {
        tags: ['CourseManagement'],
        summary: 'Create a new department (SCHOOL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Computer Science' },
                  hodId: { type: 'string', example: '60d5ec4b868e5a2b3479427b', description: 'User ID of HOD (must have HOD role)' },
                  facultyId: { type: 'string', example: '60d5ec4b868e5a2b3479427a', description: 'Faculty ID department belongs to' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Department created successfully' },
        },
      },
      get: {
        tags: ['CourseManagement'],
        summary: 'Get all departments in the school (SCHOOL_ADMIN or HOD)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Departments retrieved successfully' },
        },
      },
    },
    '/faculties': {
      post: {
        tags: ['CourseManagement'],
        summary: 'Create a new faculty (SCHOOL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code'],
                properties: {
                  name: { type: 'string', example: 'Faculty of Science' },
                  code: { type: 'string', example: 'FSC' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Faculty created successfully' },
        },
      },
      get: {
        tags: ['CourseManagement'],
        summary: 'Get all faculties in the school (SCHOOL_ADMIN or HOD)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Faculties retrieved successfully' },
        },
      },
    },

    '/programmes': {
      post: {
        tags: ['CourseManagement'],
        summary: 'Create a new academic programme (SCHOOL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code', 'durationYears', 'creditRequirement', 'category', 'departmentId'],
                properties: {
                  name: { type: 'string', example: 'BSc Computer Science' },
                  code: { type: 'string', example: 'BSC-CS' },
                  durationYears: { type: 'number', example: 4 },
                  creditRequirement: { type: 'number', example: 120 },
                  category: { type: 'string', example: 'Undergraduate Degree' },
                  departmentId: { type: 'string', example: '60d5ec4b868e5a2b3479427b' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Programme created successfully' },
        },
      },
      get: {
        tags: ['CourseManagement'],
        summary: 'Get all programmes in the school',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'schoolId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Optionally query by schoolId (e.g. for guest applicants)',
          },
          {
            name: 'departmentId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter programmes by department',
          },
        ],
        responses: {
          200: { description: 'Programmes retrieved successfully' },
        },
      },
    },

    '/enrollments': {
      post: {
        tags: ['CourseManagement'],
        summary: 'Enroll a student in an academic programme (SCHOOL_ADMIN only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['studentId', 'programmeId', 'entryLevel', 'currentLevel', 'admissionPathway'],
                properties: {
                  studentId: { type: 'string', example: '60d5ec4b868e5a2b3479427b' },
                  programmeId: { type: 'string', example: '60d5ec4b868e5a2b3479427c' },
                  entryLevel: { type: 'string', example: '100 Level' },
                  currentLevel: { type: 'string', example: '100 Level' },
                  admissionPathway: { type: 'string', enum: ['UNDERGRADUATE', 'DIRECT_ENTRY', 'PART_TIME', 'POSTGRADUATE'], example: 'UNDERGRADUATE' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Student enrolled successfully' },
        },
      },
    },
    '/students/{studentId}/enrollments': {
      get: {
        tags: ['CourseManagement'],
        summary: 'Get all programme enrollment history for a student',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'studentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID of the student',
          },
        ],
        responses: {
          200: { description: 'Student enrollment history retrieved successfully' },
        },
      },
    },

    '/courses': {
      post: {
        tags: ['CourseManagement'],
        summary: 'Create a master course definition (HOD only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseName', 'courseCode', 'creditUnits', 'level', 'semester', 'category', 'departmentId'],
                properties: {
                  courseName: { type: 'string', example: 'Data Structures' },
                  courseCode: { type: 'string', example: 'CSC301' },
                  creditUnits: { type: 'integer', example: 3 },
                  level: { type: 'integer', example: 300 },
                  semester: { type: 'string', enum: ['FIRST_SEMESTER', 'SECOND_SEMESTER'], example: 'FIRST_SEMESTER' },
                  category: { type: 'string', enum: ['CORE', 'ELECTIVE', 'GENERAL_STUDIES'], example: 'CORE' },
                  description: { type: 'string', example: 'Fundamentals of algorithms and data structures' },
                  departmentId: { type: 'string', example: '60d5ec4b868e5a2b3479427a' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Course created successfully' },
          409: { description: 'Course code already exists' },
        },
      },
      get: {
        tags: ['CourseManagement'],
        summary: 'Get courses by department (SCHOOL_ADMIN, HOD, LECTURER)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'departmentId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Courses retrieved successfully' },
        },
      },
    },
    '/course-offerings': {
      post: {
        tags: ['CourseManagement'],
        summary: 'Create an offering of a course for a semester/session (HOD only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseId'],
                properties: {
                  courseId: { type: 'string', example: '60d5ec4b868e5a2b3479427c' },
                  lecturerIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['60d5ec4b868e5a2b3479428a']
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Course offering created successfully' },
        },
      },
      get: {
        tags: ['CourseManagement'],
        summary: 'Get active course offerings (HOD, LECTURER, STUDENT)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Offerings retrieved successfully' },
        },
      },
    },
    '/course-assignments/request': {
      post: {
        tags: ['CourseManagement'],
        summary: 'Request assignment to teach a course offering (LECTURER only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseOfferingId'],
                properties: {
                  courseOfferingId: { type: 'string', example: '60d5ec4b868e5a2b3479427e' },
                  role: { type: 'string', enum: ['LEAD_LECTURER', 'CO_LECTURER', 'TA'], default: 'LEAD_LECTURER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Assignment requested successfully' },
        },
      },
    },
    '/course-assignments/{assignmentId}/approve': {
      patch: {
        tags: ['CourseManagement'],
        summary: 'Approve or reject a lecturer assignment request (HOD only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' } },
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
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Assignment request updated successfully' },
        },
      },
    },
    '/course-assignments/pending': {
      get: {
        tags: ['CourseManagement'],
        summary: 'Get all pending lecturer assignments in the school (HOD only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Pending requests retrieved successfully' },
        },
      },
    },
    '/course-enrollments/register': {
      post: {
        tags: ['CourseManagement'],
        summary: 'Register/enroll in course offerings (STUDENT only)',
        description: 'Enrolls student. Verifies that the course level is equal or lower than the student’s current level.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseOfferingIds'],
                properties: {
                  courseOfferingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['60d5ec4b868e5a2b3479427e'],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Enrollment registration submitted' },
        },
      },
    },
    '/course-enrollments/my-courses': {
      get: {
        tags: ['CourseManagement'],
        summary: 'Get current student\'s course registrations (STUDENT only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'My course registrations retrieved' },
        },
      },
    },
    '/course-offerings/{courseOfferingId}/students': {
      get: {
        tags: ['CourseManagement'],
        summary: 'Get students roster for a course offering (LECTURER, HOD, SCHOOL_ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'courseOfferingId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Student roster retrieved' },
        },
      },
    },
    '/course-offerings/{courseOfferingId}/grades': {
      post: {
        tags: ['CourseManagement'],
        summary: 'Submit/update grades for enrolled students (LECTURER only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'courseOfferingId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['grades'],
                properties: {
                  grades: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['studentId', 'score'],
                      properties: {
                        studentId: { type: 'string', example: '60d5ec4b868e5a2b3479427f' },
                        score: { type: 'number', minimum: 0, maximum: 100, example: 85 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Grades updated successfully' },
        },
      },
    },

    // ==========================================
    // --- FINANCE OFFICER & BURSARY OPERATIONS ---
    // ==========================================
    '/finance/clearance/my-status': {
      get: {
        tags: ['Finance'],
        summary: 'Student self-service: Check my financial clearance status, fee debts, and holds',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Student financial clearance status retrieved successfully' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - STUDENT role required' },
        },
      },
    },
    '/finance/metrics': {
      get: {
        tags: ['Finance'],
        summary: 'Get bursary executive dashboard KPIs and financial monitoring metrics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Financial metrics retrieved successfully' },
          403: { description: 'Forbidden - Finance operations permission required' },
        },
      },
    },
    '/finance/fees': {
      get: {
        tags: ['Finance'],
        summary: 'List institutional fee catalog with session, category, level, and department filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'academicSession', in: 'query', schema: { type: 'string', example: '2024/2025' }, description: 'Academic session' },
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['TUITION', 'ACCEPTANCE', 'HOSTEL', 'DEPARTMENTAL', 'EXAMINATION', 'LATE_REGISTRATION', 'CONVOCATION', 'OTHER'] }, description: 'Fee category' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] }, description: 'Fee structure status' },
          { name: 'departmentId', in: 'query', schema: { type: 'string' }, description: 'Department ID' },
          { name: 'level', in: 'query', schema: { type: 'integer' }, description: 'Academic level (e.g. 100, 200)' },
        ],
        responses: {
          200: { description: 'Fee catalog retrieved successfully' },
        },
      },
      post: {
        tags: ['Finance'],
        summary: 'Create a new fee structure configuration',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'category', 'amount', 'academicSession'],
                properties: {
                  name: { type: 'string', example: 'Undergraduate Tuition 2024/2025' },
                  category: { type: 'string', enum: ['TUITION', 'ACCEPTANCE', 'HOSTEL', 'DEPARTMENTAL', 'EXAMINATION', 'LATE_REGISTRATION', 'CONVOCATION', 'OTHER'] },
                  amount: { type: 'number', minimum: 1, example: 150000 },
                  currency: { type: 'string', default: 'NGN', example: 'NGN' },
                  academicSession: { type: 'string', example: '2024/2025' },
                  semester: { type: 'string', enum: ['FIRST_SEMESTER', 'SECOND_SEMESTER'] },
                  level: { type: 'integer', example: 100 },
                  departmentId: { type: 'string', example: '65f2a1b2c3d4e5f6a7b8c9d0' },
                  programmeId: { type: 'string', example: '65f2a1b2c3d4e5f6a7b8c9d1' },
                  status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], default: 'DRAFT' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Fee structure created successfully' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/finance/fees/{id}/status': {
      patch: {
        tags: ['Finance'],
        summary: 'Update fee structure status (DRAFT, ACTIVE, ARCHIVED)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Fee structure ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Fee structure status updated successfully' },
          404: { description: 'Fee structure not found' },
        },
      },
    },
    '/finance/transactions': {
      get: {
        tags: ['Finance'],
        summary: 'Get paginated payment transaction ledger with multi-criteria filtering',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by reference or student name/matric' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'] } },
          { name: 'channel', in: 'query', schema: { type: 'string', enum: ['CARD', 'BANK_TRANSFER', 'BANK_BRANCH', 'USSD', 'MANUAL_RECEIPT'] } },
          { name: 'session', in: 'query', schema: { type: 'string', example: '2024/2025' } },
        ],
        responses: {
          200: { description: 'Transaction ledger retrieved successfully' },
        },
      },
    },
    '/finance/transactions/{id}': {
      get: {
        tags: ['Finance'],
        summary: 'Get detailed transaction information by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Transaction ID' },
        ],
        responses: {
          200: { description: 'Transaction details retrieved successfully' },
          404: { description: 'Transaction not found' },
        },
      },
    },
    '/finance/transactions/record': {
      post: {
        tags: ['Finance'],
        summary: 'Manually record and reconcile offline bank teller / transfer payment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['studentId', 'amount', 'reference', 'channel', 'session'],
                properties: {
                  studentId: { type: 'string', example: '65f2a1b2c3d4e5f6a7b8c9d0' },
                  feeStructureId: { type: 'string', example: '65f2a1b2c3d4e5f6a7b8c9d1' },
                  amount: { type: 'number', minimum: 1, example: 50000 },
                  reference: { type: 'string', example: 'UB-TELLER-2025-001' },
                  channel: { type: 'string', enum: ['BANK_TRANSFER', 'BANK_BRANCH', 'MANUAL_RECEIPT'], default: 'MANUAL_RECEIPT' },
                  session: { type: 'string', example: '2024/2025' },
                  description: { type: 'string', example: 'Bank deposit slip teller #99281' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Payment recorded and reconciled successfully' },
          400: { description: 'Validation error or duplicate reference' },
        },
      },
    },
    '/finance/refunds': {
      get: {
        tags: ['Finance'],
        summary: 'List student refund claims',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'] }, description: 'Filter by refund status' },
        ],
        responses: {
          200: { description: 'Refund claims retrieved successfully' },
        },
      },
    },
    '/finance/refunds/{id}/adjudicate': {
      patch: {
        tags: ['Finance'],
        summary: 'Adjudicate student refund claim (Approve, Reject, or Disburse voucher)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Refund claim ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'] },
                  amountApproved: { type: 'number', example: 25000 },
                  adjudicationNote: { type: 'string', example: 'Approved after verifying bursary overpayment' },
                  disbursementRef: { type: 'string', example: 'CBN-PAYOUT-VCH-8821' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Refund claim adjudicated successfully' },
          400: { description: 'Invalid adjudication payload' },
          404: { description: 'Refund claim not found' },
        },
      },
    },
    '/finance/reports': {
      get: {
        tags: ['Finance'],
        summary: 'Get aggregated financial report and revenue analytics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'session', in: 'query', schema: { type: 'string', example: '2024/2025' }, description: 'Filter by academic session' },
        ],
        responses: {
          200: { description: 'Financial analytics report retrieved successfully' },
        },
      },
    },
    '/finance/reports/export': {
      get: {
        tags: ['Finance'],
        summary: 'Export financial report as CSV download or JSON',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'session', in: 'query', schema: { type: 'string', example: '2024/2025' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json'], default: 'csv' } },
        ],
        responses: {
          200: { description: 'Report exported successfully (returns text/csv or application/json)' },
        },
      },
    },
    '/finance/clearance/{studentId}': {
      get: {
        tags: ['Finance'],
        summary: 'Inspect student financial clearance status, outstanding balances, and active holds',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'studentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
        ],
        responses: {
          200: { description: 'Student financial clearance details retrieved successfully' },
          404: { description: 'Student not found' },
        },
      },
    },

    // ==========================================
    // --- EXAMINATION & RECORDS OPERATIONS ---
    // ==========================================
    '/exam-records/overview': {
      get: {
        tags: ['ExamRecords'],
        summary: 'Get Registry academic workflow monitoring overview and KPI metrics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Academic workflow metrics retrieved successfully' },
          403: { description: 'Forbidden - Examination & Records permission required' },
        },
      },
    },
    '/exam-records/results/batches': {
      get: {
        tags: ['ExamRecords'],
        summary: 'Get course offering result batches ready for Senate moderation and publishing',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING_HOD', 'HOD_APPROVED', 'PUBLISHED', 'FLAGGED'] } },
          { name: 'session', in: 'query', schema: { type: 'string', example: '2024/2025' } },
          { name: 'departmentId', in: 'query', schema: { type: 'string' } },
          { name: 'semester', in: 'query', schema: { type: 'string', enum: ['FIRST_SEMESTER', 'SECOND_SEMESTER'] } },
        ],
        responses: {
          200: { description: 'Course result batches retrieved successfully' },
        },
      },
    },
    '/exam-records/offerings/{offeringId}/publish': {
      post: {
        tags: ['ExamRecords'],
        summary: 'Officially approve and publish course results to students and transcripts (Senate Release)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'offeringId', in: 'path', required: true, schema: { type: 'string' }, description: 'Course offering ID' },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  remarks: { type: 'string', example: 'Approved by University Senate meeting on 28th September 2026' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Results successfully published to students and transcripts' },
          400: { description: 'Cannot publish results not approved by HOD or incomplete scores' },
          404: { description: 'Course offering not found' },
        },
      },
    },
    '/exam-records/offerings/{offeringId}/flag-discrepancy': {
      post: {
        tags: ['ExamRecords'],
        summary: 'Flag discrepancy on result batch and return to HOD/Lecturer for correction',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'offeringId', in: 'path', required: true, schema: { type: 'string' }, description: 'Course offering ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: { type: 'string', minLength: 5, example: 'Abnormal grade distribution: 80% A grades without CA breakdown' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Result batch discrepancy flagged and returned to HOD' },
          404: { description: 'Course offering not found' },
        },
      },
    },
    '/exam-records/students/{studentId}/audit': {
      get: {
        tags: ['ExamRecords'],
        summary: 'Get 360-degree academic audit history, GPA/CGPA per semester, and graduation eligibility',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'studentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
        ],
        responses: {
          200: { description: 'Student academic audit retrieved successfully' },
          404: { description: 'Student not found' },
        },
      },
    },
    '/exam-records/graduation/cohort': {
      get: {
        tags: ['ExamRecords'],
        summary: 'Run automated graduation degree audit for candidate cohort',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'session', in: 'query', schema: { type: 'string', example: '2024/2025' }, description: 'Academic session' },
        ],
        responses: {
          200: { description: 'Graduation cohort audit completed successfully' },
        },
      },
      post: {
        tags: ['ExamRecords'],
        summary: 'Trigger graduation degree audit computation for candidate cohort',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Graduation cohort audit executed successfully' },
        },
      },
    },
    '/exam-records/graduation/clear/{studentId}': {
      post: {
        tags: ['ExamRecords'],
        summary: 'Formally confer graduation clearance on candidate (Senate Approval)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'studentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
          { name: 'session', in: 'query', schema: { type: 'string', example: '2024/2025' } },
        ],
        responses: {
          200: { description: 'Student graduation clearance conferred successfully' },
          400: { description: 'Student does not meet graduation criteria or has outstanding holds' },
          404: { description: 'Student not found' },
        },
      },
    },
    '/exam-records/transcripts/requests': {
      get: {
        tags: ['ExamRecords'],
        summary: 'Get queue of student transcript applications awaiting processing or issuance',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['REQUESTED', 'PROCESSING', 'ISSUED', 'REJECTED'] } },
        ],
        responses: {
          200: { description: 'Transcript requests retrieved successfully' },
        },
      },
    },
    '/exam-records/transcripts/request': {
      post: {
        tags: ['ExamRecords'],
        summary: 'Student or Officer self-service application for official academic transcript',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['destinationAddress', 'destinationEmail', 'recipientName', 'purpose', 'deliveryMethod'],
                properties: {
                  studentId: { type: 'string', description: 'Target student ID (optional for student, required if staff requesting)' },
                  destinationAddress: { type: 'string', example: 'Admissions Office, Oxford University, Oxford, UK' },
                  destinationEmail: { type: 'string', format: 'email', example: 'transcripts@oxford.ac.uk' },
                  recipientName: { type: 'string', example: 'Postgraduate Admissions Board' },
                  purpose: { type: 'string', enum: ['EMPLOYMENT', 'FURTHER_STUDIES', 'VISA_IMMIGRATION', 'PERSONAL', 'SCHOLARSHIP', 'OTHER'] },
                  deliveryMethod: { type: 'string', enum: ['ELECTRONIC', 'PHYSICAL_COURIER', 'STUDENT_PICKUP'] },
                  notes: { type: 'string', example: 'Include certified English syllabus description' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Transcript request created and submitted successfully' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/exam-records/transcripts/{id}/issue': {
      post: {
        tags: ['ExamRecords'],
        summary: 'Generate, cryptographically sign (SHA-256 hash), and issue official academic transcript PDF',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Transcript request ID' },
        ],
        responses: {
          200: { description: 'Official academic transcript generated and signed successfully with tamper-proof hash and verification URL' },
          400: { description: 'Student has unresolved financial holds or pending results' },
          404: { description: 'Transcript request not found' },
        },
      },
    },
    '/exam-records/transcripts/verify/{code}': {
      get: {
        tags: ['ExamRecords'],
        summary: 'Public verification of official academic transcript by verification code',
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: 'Official transcript verification code' },
        ],
        responses: {
          200: { description: 'Transcript verified successfully with integrity verification hash' },
          404: { description: 'Transcript not found or invalid verification code' },
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
