# Admin API Integration Guide

This document provides a step-by-step guide for frontend developers or API consumers on how to interact with the admin-facing endpoints, specifically focusing on **Application Management** and **Staff Operations**.

## Overview & Prerequisites

- **Authentication / Login**: Administrators can now log in using either their **Email** or their generated **Admin ID** (e.g., `UPH-J-1239`) via the standard `/api/v1/auth/login` endpoint. Ensure your login forms reflect this flexibility (e.g., "Email or Admin ID").
- **Authorization**: Protected endpoints require a valid Bearer token (`Authorization: Bearer <TOKEN>`).
- **Tenant Isolation**: The logged-in admin is securely tied to a specific `tenantId` (School). The backend automatically scopes all listing and mutation operations to only affect records belonging to that school. Do not send `schoolId` in payloads; it is extracted securely from the JWT.

---

## 1. Application Management

These endpoints allow school administrators to browse, filter, and make decisions on submitted student applications.

### 1a. List and Filter Applications

Fetch a paginated list of applications submitted to the administrator's school.

- **Endpoint**: `GET /api/v1/admin/applications`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters (All Optional)**:
  - `page` (number): The page number (default is `1`).
  - `limit` (number): Applications per page (default is `10`, max `100`).
  - `status` (string): Filter by state. Options: `NOT_STARTED`, `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`.
  - `program` (string): Filter by the selected standard course/program.
  - `session` (string): Filter by the academic session.
  - `search` (string): Free-text search matching the applicant's first name, last name, or the application number.
- **Response**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "60d5ecb7...",
        "applicationNumber": "APP-00123",
        "status": "SUBMITTED",
        "session": "2023/2024",
        "academicHistory": { ... },
        "programmeSelection": { "course": "Computer Science", ... },
        "applicant": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com"
        }
        // ...other application fields
      }
    ],
    "meta": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
  ```
  The backend now returns the full application record for each item, including nested `personalDetails`, `academicHistory`, `programmeSelection`, `documents`, and the full `applicant` and `school` relations.

### 1b. Update Application Status (Approve/Reject)

Transition an application to a new state (e.g., from `SUBMITTED` to `UNDER_REVIEW`, `APPROVED`, or `REJECTED`).

- **Endpoint**: `PATCH /api/v1/admin/applications/:applicationId/status`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "status": "REJECTED",
    "rejectionReason": "Your uploaded O-Level result does not meet the minimum requirements."
  }
  ```
  **Important Rule**: If the `status` is set to `REJECTED`, the `rejectionReason` string becomes **strictly required**. For `UNDER_REVIEW` or `APPROVED`, the `rejectionReason` can be omitted (and will be cleared by the backend if previously set).
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Application status updated successfully",
    "data": {
      "id": "60d5ecb7...",
      "status": "REJECTED",
      "rejectionReason": "Your uploaded O-Level result does not meet the minimum requirements."
    }
  }
  ```

---

## 2. Staff Management

These endpoints allow the School Admin to onboard and review additional teaching and administrative staff.

### 2a. Onboard a Lecturer

Create an account for a new lecturer.

- **Endpoint**: `POST /api/v1/admin/lecturers`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "fullName": "Jane Smith",
    "staffId": "STAFF-001",
    "email": "jane@demouni.edu.ng",
    "department": "Computer Science",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: Returns success. The lecturer receives an email with an OTP for verification.

### 2b. Onboard a Hostel Admin

Create an account for a new hostel administrator.

- **Endpoint**: `POST /api/v1/admin/hostel-admins`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Same structure as `2a. Onboard a Lecturer`.

### 2c. Approve a Staff Account

Approve a pending staff member's account, granting them access to the platform.

- **Endpoint**: `PATCH /api/v1/admin/staff/:userId/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Success message.

### 2d. Decline a Staff Account

Reject a staff member's account onboarding attempt.

- **Endpoint**: `PATCH /api/v1/admin/staff/:userId/reject`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "remark": "This staff ID does not exist in our HR registry."
  }
  ```
  _The `remark` field is optional but heavily recommended._
- **Response**: Success message indicating rejection.

---

## 3. Super Admin Operations

Super Admins have distinct administrative paths. These are used primarily by platform managers to onboard institutions and their point-of-contact administrators.

### 3a. Onboard a School Admin

A Super Admin can create the primary `SCHOOL_ADMIN` for a specific school. The backend automatically auto-generates a unique `adminId` using the school's ID prefix. Both email and `adminId` credentials are fundamentally dispatched to the provided email to log in alongside an OTP.

- **Endpoint**: `POST /api/v1/super-admin/school-admins`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "schoolId": "UPH-009",
    "email": "jane@demouni.edu.ng",
    "school": "University of Port Harcourt",
    "password": "SecurePassword123!"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "School admin account created successfully."
    // A globally unique adminId string is silently minted onto the DB record
  }
  ```

### 3b. Verify / Reject School Admins

Newly created school admins are locked out structurally until explicitly approved. Even though they hold an OTP, Super Admins orchestrate the final gatekeeping:

- **Verify Endpoint**: `PATCH /api/v1/super-admin/school-admins/:userId/verify`
- **Reject Endpoint**: `PATCH /api/v1/super-admin/school-admins/:userId/reject`
  - Accepts an optional JSON body: `{"remark": "Reason"}`
