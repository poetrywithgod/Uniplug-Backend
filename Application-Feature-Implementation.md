# Applicant Admission Application: Implementation Plan

Based on the provided UI screenshots, we need to build a multi-step application form where applicants can apply for a program at a specific school (tenant). Below is the comprehensive technical implementation plan to achieve this.

## 1. Database Schema Updates (Prisma & MongoDB)

We need to introduce an `Application` model and associated types to handle the multi-step draft nature of the form. Using Prisma's MongoDB composite types (`type` keyword) is ideal for multi-step data that gets saved progressively.

### Enums to Add

- `ApplicationStatus`: `NOT_STARTED`, `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`
- `StudyMode`: `FULL_TIME`, `PART_TIME`, `DISTANCE_LEARNING`
- `Gender`: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`
- `DocumentType`: `TRANSCRIPT`, `ID_PASSPORT`, `PASSPORT_PHOTOGRAPH`, `WAEC/NECO/NABTEB_CERTIFICATE`

### Models & Composite Types

```prisma
// Composite Types for Step Data
type PersonalDetails {
  firstName   String
  lastName    String
  dateOfBirth DateTime
  gender      Gender
  phoneNumber String
  email       String
}

type AcademicRecord {
  institution          String
  highestQualification String
  graduationYear       Int
  overallGrade         String
}

type ProgrammeSelection {
  faculty     String
  department  String
  studyMode   StudyMode
}

type UploadedDocument {
  documentType DocumentType
  fileUrl      String
  uploadedAt   DateTime @default(now())
}

// Main Model
model Application {
  id                  String             @id @default(auto()) @map("_id") @db.ObjectId
  applicantId         String             @db.ObjectId
  schoolId            String             @db.ObjectId

  status              ApplicationStatus  @default(DRAFT)
  progressPercentage  Int                @default(0) // Tracks 0 - 100%

  // Step 1: Personal Details
  personalDetails     PersonalDetails?

  // Step 2: Academic History
  academicHistory     AcademicRecord?

  // Step 3: Programme Selection
  programmeSelection  ProgrammeSelection?

  // Step 4: Documents
  documents           UploadedDocument[]

  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  // Relations
  applicant           User               @relation(fields: [applicantId], references: [id])
  // school              Tenant           @relation(...) // Assuming a School/Tenant model exists
}
```

## 2. API Endpoints to Create (`src/modules/application`)

The application process is modular, so the API should support saving draft states per step.

### A. Dashboard & Initialization

- `GET /api/v1/applications`
  - Fetches the user's applications for the dashboard (Status, Summary, Notifications).
- `POST /api/v1/applications/start`
  - Body: `{ schoolId: string }`
  - Action: Creates a new `Application` with `status: DRAFT` and `progressPercentage: 20`. Returns the `applicationId`.

### B. Step-by-Step Form Submission

_Each step updates an existing application and increments the progress percentage._

- `PATCH /api/v1/applications/:id/personal-details`
  - Validates and saves First Name, Last Name, DOB, Gender, Phone, Email.
  - Updates progress to ~40%.
- `PATCH /api/v1/applications/:id/academic-history`
  - Validates and saves Institution, Qualification, Year, Grade.
  - Updates progress to ~60%.
- `PATCH /api/v1/applications/:id/programme`
  - Validates and saves Faculty, Course, Study Mode.
  - Updates progress to ~80%.

### C. Document Handling (Step 4)

_Cloud Storage solution: Cloudinary_

- `POST /api/v1/applications/:id/upload-url`
  - Body: `{ documentType: string, fileName: string, fileType: string }`
  - Action: Generates a secure, signed upload signature for the frontend to upload files directly to Cloudinary. Using a `POST` request is correct here because you need to send file metadata to the server to generate a specific, secure upload ticket.
- `PATCH /api/v1/applications/:id/documents`
  - Action: Saves the returned `fileUrl` and `documentType` into the database array once the frontend finishes the Cloudinary upload.

### D. Review & Submit (Step 5)

- `POST /api/v1/applications/:id/submit`
  - Action: Validates that ALL required fields across all steps are filled out and at least the minimum required documents are uploaded.
  - Updates `status` to `SUBMITTED` and `progressPercentage` to `100`.

## 3. Data Validation (Zod Schemas)

Create `src/modules/application/applicationSchemas.ts`:

- `personalDetailsSchema`: strict validations for dates, string lengths, and email/phone normalization.
- `academicHistorySchema`: checks for valid grade formats and reasonable graduation years.
- `programmeSelectionSchema`: validates Enums (Study Modes).

## 4. File Structure to Generate

- `src/modules/application/applicationController.ts`
- `src/modules/application/applicationService.ts`
- `src/modules/application/applicationRoutes.ts`
- `src/modules/application/applicationSchemas.ts`

## 5. Third-Party / DevOps Needs

- **File Upload Strategy**: Decide between **Amazon S3**, **Cloudinary**, or local storage (Not recommended for scalable Docker containers on Back4App).
- **Email Notifications**: Extending the `email.ts` utility to send "Application Started" and "Application Submitted successfully" emails.

---

### Questions for your review before implementation:

1. **File Storage:** Do you have an AWS S3 bucket or Cloudinary account ready for document uploads, or should I install and set up one of those SDKs now?
2. **Relationships:** Does a `Tenant` or `School` model already exist in Prisma for us to link the `schoolId` to?
3. **Application Scope:** Can a user apply to multiple schools/programs at once, or just one active application per applicant?
