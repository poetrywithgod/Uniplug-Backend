# Admin Application Management Implementation Plan

This document outlines the detailed plan to implement application management capabilities for school administrators on the admin dashboard.

## 1. Database Schema Updates (`prisma/schema.prisma`)

We will introduce fields track the academic session and any rejection feedback.

**Updates to `Application` model:**

- `session String?`
- `rejectionReason String?`

_Action needed: Run `npx prisma generate` and `npx prisma db push` right after saving these updates._

## 2. API Endpoints Documentation

We are adding two primary administrative APIs.

### A. Get Applications (List with Filters & Pagination)

- **Endpoint:** `GET /api/v1/admin/applications`
- **Roles:** `SCHOOL_ADMIN`
- **Query Parameters:**
  - `page` (number, defaults to 1)
  - `limit` (number, defaults to 10)
  - `status` (string, optional) - enum `['NOT_STARTED', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']`
  - `program` (string, optional) - filters by `programmeSelection.course`
  - `session` (string, optional) - filters by the new `session` field
  - `search` (string, optional) - free text search matching the `applicationNumber` (or applicant name)
- **Response Shape:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "60d5ecb74d6bb892b704c10c",
        "applicationNumber": "APP-2023-1234",
        "status": "SUBMITTED",
        "session": "2023/2024",
        "applicantId": "..."
        // ... application fields ...
      }
    ],
    "meta": {
      "total": 54,
      "page": 1,
      "limit": 10,
      "totalPages": 6
    }
  }
  ```

### B. Update Application Status

- **Endpoint:** `PATCH /api/v1/admin/applications/:id/status`
- **Roles:** `SCHOOL_ADMIN`
- **Body payload:**
  ```json
  {
    "status": "APPROVED", // Or "REJECTED", "UNDER_REVIEW"
    "rejectionReason": "Your O-Level results did not meet the criteria." // Required if status is "REJECTED"
  }
  ```
- **Response Shape:**
  ```json
  {
    "status": "success",
    "message": "Application status updated successfully",
    "data": {
      // The updated application record
      "id": "...",
      "status": "REJECTED",
      "rejectionReason": "Your O-Level results did not meet the criteria."
    }
  }
  ```

## 3. Validation Schemas (`src/modules/admin/adminSchemas.ts`)

- `getApplicationsQuerySchema`: Zod schema combining `coerce.number()` for page/limit, and optional string constraints for filters/search.
- `updateApplicationStatusSchema`: Zod schema validating body fields. Will include a custom `.refine()` rule to guarantee `rejectionReason` is provided when `status === 'REJECTED'`.

## 4. Business Logic (`src/modules/admin/adminService.ts`)

- **`getApplications` function:**
  - Map `res.locals.user.tenantId` to query `where: { schoolId: tenantId }`.
  - Apply text `search` conditions targeting the `applicationNumber` field locally.
  - Implement Promise.all for `prisma.application.findMany` (with `skip` / `take`) and `prisma.application.count`.
- **`updateApplicationStatus` function:**
  - Ensure updating `schoolId` matches the admin's `tenantId`.
  - Overwrite `status` and `rejectionReason`.

## 5. Routing and Controller (`src/modules/admin/adminRoute.ts` & `src/modules/admin/adminController.ts`)

- Wire the Zod validation schemas into the payload validation middleware.
- Ensure the `requireRole('SCHOOL_ADMIN')` policy is attached.
- Feed parsed requests safely to the service handlers.

## 6. Seed a Verified School Admin

- Update/run a seed script (e.g., `src/scripts/seedMockTenant.ts`) to insert a Tenant (school) and a verified User with the `SCHOOL_ADMIN` role attached to that `tenantId`.
- This gives us a valid test account to authenticate and perform these application management tasks.
