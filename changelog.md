# Changelog

## Date

- 2026-04-10

## Latest Update (Application Module & Integrations)

- Added comprehensive Application module complete with routes, schemas, controllers, and services for applicant management.
- Extended Prisma schema with robust application-related types and models (`Application`, `ProgrammeSelection`, `PersonalDetails`, `AcademicRecord`, `UploadedDocument`, `ApplicationStatus`).
- Included `applicationNumber` generation logic inside the application initialization stream.
- Modified `startApplication` logic to return existing application data if one already exists, streamlining user flow securely.
- Streamlined overall endpoint response structures and controller parameter handling across application services.
- Migrated image management assets to Cloudinary with direct integration for applicant uploads.
- Bootstrapped ecosystem with a new mock tenant seeding script mapping a demo university to support end-to-end testing.
- Polished configuration styling and formatting inside `envConfig` and `swaggerConfig`.
- 2026-04-14

## Latest Update (Tenant Governance + Approval Hierarchy)

- Refactored platform to a multi-tenant governance model with dedicated tenant records.
- Added `Tenant` model and `ApprovalStatus` enum (`PENDING`, `VERIFIED`, `REJECTED`) in Prisma schema.
- Updated role model to support hierarchy:
  - `SUPER_ADMIN`
  - `SCHOOL_ADMIN`
  - `LECTURER`
  - `HOSTEL_ADMIN`
  - `APPLICANT`
  - `PARENT`
- Extended user domain with tenant/governance fields:
  - `tenantId`
  - `school`
  - `schoolId`
  - `approvalStatus`
  - `approvalRemark`
- Added new super-admin module endpoints:
  - `POST /api/v1/super-admin/tenants`
  - `POST /api/v1/super-admin/school-admins`
  - `PATCH /api/v1/super-admin/school-admins/:userId/verify`
  - `PATCH /api/v1/super-admin/school-admins/:userId/reject`
- Refactored school-admin module behavior:
  - school admins create lecturer/hostel-admin accounts under their tenant
  - school admins verify/reject lecturer and hostel-admin accounts
  - rejected lecturer/hostel-admin and school-admin accounts can be resubmitted
- Enforced approval gating in auth flow:
  - OTP verification remains required
  - privileged roles (`SCHOOL_ADMIN`, `LECTURER`, `HOSTEL_ADMIN`) are blocked from login actions until `approvalStatus = VERIFIED`
- Updated onboarding email templates for governance context:
  - added school-admin onboarding email
  - included school and schoolId details in staff onboarding
- Replaced Swagger spec to align with new hierarchy and endpoint set (`Auth`, `SuperAdmin`, `SchoolAdmin`, `Meta`).
- Build verification:
  - `npm run build` passes after controller param typing fixes.
- Remaining environment blocker:
  - database schema push still depends on valid MongoDB credentials (`SCRAM bad auth` issue remains external to source changes).

## Latest Update

- Updated root API intro response to always expose module routes and a short API description.
- Registered auth and task modules explicitly in the root response endpoint list.
- Retried MongoDB schema sync with Prisma; push is still blocked by Atlas authentication failure.

## Latest Update (Email Logo Rendering)

- Updated email templates to use a direct public Cloudinary delivery URL (`res.cloudinary.com`) for the brand logo.
- This resolves logo rendering issues in mailbox clients that do not render `asset.cloudinary.com` links reliably.

## Latest Update (Brand Colors)

- Updated all email templates to use the requested brand palette only:
  - `#0c241f`
  - `#ffffff`
- Applied the palette consistently to body, containers, OTP blocks, notes, borders, and footer text.

## Latest Update (Swagger + Task Removal)

- Added Swagger API documentation with interactive UI at `/api-docs` and raw spec at `/api-docs.json`.
- Added an auth-focused OpenAPI spec covering:
  - register
  - verify OTP
  - resend OTP
  - login
- Removed task API source files entirely:
  - routes
  - controllers
  - Task model file
- Removed task routing from app initialization and root endpoint intro metadata.
- Removed `Task` model from Prisma schema to fully remove task API domain from database schema.
- Clean-rebuilt `dist` so old task artifacts are no longer present in compiled output.

## Latest Update (Departments + Admin Onboarding + Password Recovery)

- Added Nigerian university departments dataset file at `data/departments.json`.
- Added metadata module endpoint:
  - `GET /api/v1/meta/departments`
- Added admin onboarding module with admin-only protected endpoints:
  - `POST /api/v1/admin/lecturers`
  - `POST /api/v1/admin/hostel-admins`
- Added auth/role middleware to enforce JWT authentication and `ADMIN` role for onboarding endpoints.
- Extended roles in Prisma schema:
  - `LECTURER`
  - `HOSTEL_ADMIN`
- Extended `User` schema fields for staff and password recovery:
  - `staffId`
  - `department`
  - `resetOtpHash`
  - `resetOtpExpiresAt`
  - `phoneNumber` made optional
- Added OTP-based password recovery flow:
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
- Updated email utility:
  - added staff onboarding email with login credentials + verification OTP
  - updated logo URL to provided Cloudinary asset link
- Expanded Swagger docs to include:
  - auth forgot/reset endpoints
  - admin onboarding endpoints
  - departments metadata endpoint
  - bearer auth security scheme for protected admin endpoints
- Updated root API intro in `/` to include newly registered modules (`auth`, `admin`, `meta`) and clearer API description.
- Build verification:
  - `npm run build` passed successfully
- Database sync status:
  - `npx prisma@6.19 db push` still failing due MongoDB authentication (`SCRAM bad auth`).

## Completed Work

### 1) Auth system foundation

- Added registration and login functionality.
- Added OTP verification flow for newly registered users.
- Added resend OTP flow.
- Enforced verified-account-only login.

### 2) Role policy changes

- Public registration supports only these roles:
  - `applicant`
  - `parent`
- Public registration for `admin` is blocked.
- Added backend role allowlist checks in validation and service layers.

### 3) Request contract and validation

- Registration payload now expects:
  - `firstName`
  - `lastName`
  - `email`
  - `phoneNumber`
  - `password`
  - `role`
- Removed backend dependency on `confirmPassword` (frontend-only validation).
- Added request validation middleware using Zod.
- Added auth schemas for:
  - register
  - verify OTP
  - resend OTP
  - login

### 4) Input sanitization and normalization

- Added centralized sanitizers:
  - whitespace normalization
  - name normalization
  - email normalization (lowercase + trim)
  - phone normalization
  - HTML escaping utility
- Applied sanitization in auth validation and service logic for defense-in-depth.

### 5) Security implementation

- Added password hashing with `bcryptjs`.
- Added password comparison on login.
- Added OTP generation and hashing (`sha256`) before storage.
- Added OTP expiration handling.
- Added JWT access token signing.
- Added environment configuration reads for:
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `OTP_EXPIRES_IN_MINUTES`

### 6) Database model updates (Prisma + Mongo)

- Updated Prisma schema with:
  - `Role` enum: `APPLICANT`, `PARENT`, `ADMIN`
  - `User` model fields:
    - profile fields
    - `passwordHash`
    - `role`
    - `isVerified`
    - `emailOtpHash`
    - `emailOtpExpiresAt`
    - timestamps
- Prisma client generation succeeded.
- Database `db push` failed due MongoDB authentication failure in `DATABASE_URL`.

### 7) Module structure refactor (initial)

- Created auth module files for controller/service/route/schema.
- Mounted auth routes at `/api/v1/auth`.

### 8) Module structure refactor (requested flattening)

- Flattened auth module structure from nested folders to direct files:
  - `src/modules/auth/authController.ts`
  - `src/modules/auth/authRoute.ts`
  - `src/modules/auth/authService.ts`
  - `src/modules/auth/authSchemas.ts`
- Updated imports accordingly.
- Removed old nested auth files:
  - `src/modules/auth/controllers/authController.ts`
  - `src/modules/auth/routes/authRoutes.ts`
  - `src/modules/auth/services/authService.ts`
  - `src/modules/auth/validators/authSchemas.ts`

### 9) Move module-specific security helper

- Moved `authSecurity.ts` from shared utils to auth module:
  - old: `src/utils/authSecurity.ts`
  - new: `src/modules/auth/authSecurity.ts`
- Updated all imports to use module-local auth security helper.

### 10) Shared folders policy

- Kept shared `utils` and `types` centralized at root-level source folders:
  - `src/utils/*`
  - `src/types/*`

### 11) Email brand migration

- Rebranded email templates from old brand identity to Uniplug.
- Updated sender identity text.
- Updated email copy mentioning old brand name.
- Updated support contact references to Uniplug domain.
- Updated logo references to Uniplug-branded placeholder asset.

### 12) Build and verification

- Installed dependencies:
  - runtime: `bcryptjs`, `jsonwebtoken`, `zod`
  - dev types: `@types/jsonwebtoken`
- Fixed Zod typing compatibility in validation middleware.
- TypeScript build succeeded.
- Sentry sourcemap upload succeeded as part of build script.

## Current API Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/resend-otp`
- `POST /api/v1/auth/login`

## In Progress / Next Work

- Update `.env` MongoDB credentials (`DATABASE_URL`) and re-run schema sync:
  - command: `npx prisma@6.19 db push`
- Verify live endpoint behavior end-to-end with real requests:
  - register
  - verify otp
  - resend otp
  - login
- Implement internal-only admin creation flow (seed script or protected internal endpoint).
- Replace temporary logo URL in email templates with final production brand asset.
- Optional: clean `dist` before build to avoid stale compiled artifacts from old paths.

## Notes

- Build currently passes.
- Database schema application is blocked only by MongoDB auth credentials.
