# Plan: Hostel Management & Application System

**TL;DR**
Create a new `hostel` module and Prisma schemas to establish a full CRUD system for hostels limited to `HOSTEL_ADMIN`s. Additionally, build an application endpoint so `STUDENT`s can apply for spaces, while strictly enforcing capacity limits, one application per student, and gender requirements.

## Steps

1. **Schema Updates & Migration**
   - Add enums: `HostelType` (`MALE`, `FEMALE`, `MIXED`) and `HostelApplicationStatus` (`PENDING`, `APPROVED`, `REJECTED`).
   - Create `Hostel` model with fields from your UI details (`name`, `capacity`, `price`, `totalRooms`, `totalBlocks`, `totalWings`, `spacePerRoom`) explicitly linked to a `Tenant` (`schoolId`).
   - Create `HostelApplication` model linking `User` (student), `Hostel`, and `Tenant`.
   - Run `npx prisma format`, `npx prisma generate`, and setup your migration.

2. **Validation Setup**
   - Define exact Zod schemas for creating (`createHostelSchema`), updating hostels, and a schema for admin review logic (`reviewApplicationSchema`).

3. **Service Layer (`hostelService.ts`)**
   - **Hostel CRUD**: Implement `createHostel`, `updateHostel`, `deleteHostel`, `getHostels` scoped strictly to the `HOSTEL_ADMIN`'s `tenantId`. A calculation will determine available spaces dynamically from `capacity - (num of APPROVED applications)`.
   - **Student Application**: Implement `applyForHostel`:
     - Verify actor has `STUDENT` role and belongs strictly to the same `schoolId` / `tenantId` as the `Hostel`.
     - Check the student does not already have a pending or approved application.
     - Validate the student's gender (from `PersonalDetails`) matches the `HostelType`.
     - Reject if `approved applications count` has hit `capacity`.
   - **Admin Application Review**: Require `HOSTEL_ADMIN` role and verify `schoolId` bounds. Ensure capacity hasn't been hit midway upon toggling a status to `APPROVED`.

4. **Controllers & Routes (`hostelController.ts`, `hostelRoute.ts`)**
   - `POST/PUT/DELETE /hostels` → restricted to `HOSTEL_ADMIN`.
   - `POST /hostels/:id/apply` → restricted to `STUDENT`.
   - `GET /hostels/:id/applications` → restricted to `HOSTEL_ADMIN`.
   - `PATCH /hostels/applications/:id/review` → restricted to `HOSTEL_ADMIN`.

5. **Server Integration**
   - Mount your new `/hostels` route onto your main root router.

## Relevant files

- schema.prisma — Add new models & enums.
- `/src/modules/hostel/*` — New scaffolding (similar to your existing auth/admin modules) to house `hostelRoute.ts`, `hostelController.ts`, `hostelService.ts`, and `hostelSchemas.ts`.

## Verification

1. Local tests simulating a `HOSTEL_ADMIN` token to run `createHostel` (with pricing and capacity).
2. Simulating a `STUDENT` token to call `/apply`.
3. Verifying that mismatched genders and exceeded capacities trigger direct HTTP error responses.
4. Simulating a `HOSTEL_ADMIN` token pulling up `/applications` and changing status from `PENDING` to `APPROVED`.

## Decisions

- Operations restricted entirely to `HOSTEL_ADMIN`s. `SCHOOL_ADMIN`s are purposefully locked out to maintain role boundaries as confirmed.
- Gender matching will be strictly validated.
- A student is effectively restricted to one active hostel application queue at a time.
