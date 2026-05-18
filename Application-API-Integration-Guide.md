# Applicant Admission Application API Integration Guide

This document provides a step-by-step guide for frontend developers or API consumers on how to interact with the multi-step admission application feature.

## Overview

The application process is designed as a **progressive draft system**. An applicant will save their progress at each step. Once all steps are completed (progress reaches 100%), the application can be formally submitted.

### Prerequisites

- **Authentication**: All endpoints require a valid Bearer token (`Authorization: Bearer <TOKEN>`) for a user with the role `APPLICANT`.
- **Application ID**: The ID generated in **Step 1** is required for all consecutive steps.

---

## Step 1: Start an Application

Initialize a blank application draft for a specific school.

- **Endpoint**: `POST /api/v1/application`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "schoolId": "UPH-009"
  }
  ```
- **Response**: Returns the `applicationId` and initializes `progressPercentage` and `status` to `DRAFT`.
  **Note**: Save the `id` from the response; you will use it as `:applicationId` in all following steps.

---

## Step 2: Personal Details

Update the applicant's personal information.

- **Endpoint**: `PATCH /api/v1/application/:applicationId/personal-details`
- **Body**:
  ```json
  {
    "firstName": "Jane",
    "lastName": "Doe",
    "dateOfBirth": "2000-01-01",
    "gender": "FEMALE",
    "phoneNumber": "+2348012345678",
    "email": "jane@uniplug.com"
  }
  ```
  Valid `gender` options: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`.

---

## Step 3: Academic History

Update the applicant's prior educational history.

- **Endpoint**: `PATCH /api/v1/application/:applicationId/academic-history`
- **Body**:
  ```json
  {
    "institution": "University of Lagos",
    "highestQualification": "BSc",
    "graduationYear": 2022,
    "overallGrade": "First Class"
  }
  ```

---

## Step 4: Programme Selection

Select the faculty, course, and mode of study.

- **Endpoint**: `PATCH /api/v1/application/:applicationId/programme-selection`
- **Body**:
  ```json
  {
    "faculty": "Engineering",
    "course": "Computer Engineering",
    "studyMode": "FULL_TIME"
  }
  ```
  Valid `studyMode` options: `FULL_TIME`, `PART_TIME`, `DISTANCE_LEARNING`.

---

## Step 5: Document Uploads (Cloudinary)

Handling file uploads is a 3-part process to ensure secure, direct-to-cloud transfers without overloading the backend.

### 5a. Get Upload Signature

Request permission from the backend to upload a specific document type.

- **Endpoint**: `POST /api/v1/application/:applicationId/documents/signature`
- **Body**:
  ```json
  {
    "documentType": "TRANSCRIPT",
    "fileName": "academic_transcript.pdf"
  }
  ```
  Valid document types: `TRANSCRIPT`, `ID_PASSPORT`, `PASSPORT_PHOTOGRAPH`, `CERTIFICATE`.
- **Response**: The server explicitly returns a secure `signature`, `timestamp`, `apiKey`, `cloudName`, and `folder`.

### 5b. Direct Upload to Cloudinary (Frontend Action)

Using standard HTML form-data/Fetch, send the file _directly_ to the Cloudinary API using the keys provided in `5a`.

- **Endpoint**: `POST https://api.cloudinary.com/v1_1/<cloudName>/auto/upload`
- **Form Data**:
  - `file`: The actual file object.
  - `api_key`: From response 5a.
  - `timestamp`: From response 5a.
  - `signature`: From response 5a.
  - `folder`: From response 5a.

### 5c. Save Document to Database

Once Cloudinary successfully receives the file and responds with a `secure_url`, send that URL back to the backend to link to the application.

- **Endpoint**: `POST /api/v1/application/:applicationId/documents`
- **Body**:
  ```json
  {
    "documentType": "TRANSCRIPT",
    "fileUrl": "https://res.cloudinary.com/.../TRANSCRIPT.pdf"
  }
  ```
  _Repeat Step 5 for any other required documents._

---

## Step 6: Final Submission

Once steps 1-5 are completed, the application is ready to be locked and submitted for review.

- **Endpoint**: `POST /api/v1/application/:applicationId/submit`
- **Logic**: The API will check if `progressPercentage` is at `100`. If so, it changes `status` from `DRAFT` to `SUBMITTED`.
- **Response**: Success message confirming the submission.

---

## Summary Utilities

### Get My Applications

Fetch all applications tied to the currently authenticated applicant, along with their draft progress.

- **Endpoint**: `GET /api/v1/application`
- **Headers**: `Authorization: Bearer <token>`
