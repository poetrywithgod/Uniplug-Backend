# Changelog

## Date

- 2026-04-10

## Latest Update

- Updated root API intro response to always expose module routes and a short API description.
- Registered auth and task modules explicitly in the root response endpoint list.
- Retried MongoDB schema sync with Prisma; push is still blocked by Atlas authentication failure.

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
