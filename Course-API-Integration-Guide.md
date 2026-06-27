# Course & Academic Management API Integration Guide

This guide details the endpoints available for **Course Creation, Offering Management, Lecturer Assignment, Student Enrollment, and Grading** within the Uniplug system.

## Base URL

All API paths described below are relative to `{{BASE_URL}}/api/v1`

## Authentication

All endpoints require a valid `Bearer Token` passed in the `Authorization` header:
`Authorization: Bearer <your-jwt-token>`

---

## 1. Department Management (School Admin)

### 1.1 Create Department

- **Endpoint:** `POST /departments`
- **Role Required:** `SCHOOL_ADMIN`
- **Description:** Creates an academic department and maps a Head of Department (HOD) to it.

**Payload:**

```json
{
  "name": "Computer Science",
  "hodId": "60d5ec4b868e5a2b3479427b" // Optional: User ID of HOD
}
```

**Returns (201):**

```json
{
  "status": "success",
  "department": {
    "id": "60d5ec4b868e5a2b3479427a",
    "name": "Computer Science",
    "hodId": "60d5ec4b868e5a2b3479427b",
    "tenantId": "60d5ec4b868e5a2b34794270",
    "createdAt": "2026-06-27T19:30:00.000Z",
    "updatedAt": "2026-06-27T19:30:00.000Z"
  }
}
```

### 1.2 Get All Departments

- **Endpoint:** `GET /departments`
- **Role Required:** `SCHOOL_ADMIN` or `HOD`
- **Description:** Retrieves all departments under the school.

**Returns (200):** A list of departments.

---

## 2. Course Management (HOD)

### 2.1 Create Course

- **Endpoint:** `POST /courses`
- **Role Required:** `HOD`
- **Description:** Creates a master course definition within a department.

**Payload:**

```json
{
  "courseName": "Data Structures & Algorithms",
  "courseCode": "CSC301",
  "creditUnits": 3,
  "level": 300, // 100, 200, 300, 400, 500, etc.
  "category": "CORE", // CORE | ELECTIVE | GENERAL_STUDIES
  "description": "Fundamental algorithms and structures", // Optional
  "departmentId": "60d5ec4b868e5a2b3479427a"
}
```

**Returns (201):**

```json
{
  "status": "success",
  "course": {
    "id": "60d5ec4b868e5a2b3479427c",
    "courseName": "Data Structures & Algorithms",
    "courseCode": "CSC301",
    "creditUnits": 3,
    "level": 300,
    "category": "CORE",
    "description": "Fundamental algorithms and structures",
    "departmentId": "60d5ec4b868e5a2b3479427a",
    "createdByHodId": "60d5ec4b868e5a2b3479427b",
    "status": "ACTIVE",
    "tenantId": "60d5ec4b868e5a2b34794270",
    "createdAt": "..."
  }
}
```

### 2.2 Get Courses by Department

- **Endpoint:** `GET /courses`
- **Role Required:** `HOD` | `SCHOOL_ADMIN` | `LECTURER`
- **Query Params:** `departmentId` (Required)

**Returns (200):** A list of courses within the specified department.

---

## 3. Course Offering Management (HOD)

### 3.1 Create Course Offering

- **Endpoint:** `POST /course-offerings`
- **Role Required:** `HOD`
- **Description:** Makes a course available for a specific academic session and semester.

**Payload:**

```json
{
  "courseId": "60d5ec4b868e5a2b3479427c",
  "academicSession": "2025/2026", // Format: YYYY/YYYY
  "semester": "FIRST_SEMESTER"
}
```

**Returns (201):** Newly created course offering object.

### 3.2 Get Active Course Offerings

- **Endpoint:** `GET /course-offerings`
- **Role Required:** `HOD` | `LECTURER` | `STUDENT`
- **Description:** Retrieves active offerings (e.g. for registration or browsing).

**Returns (200):** A list of active course offerings with nested course definitions.

---

## 4. Lecturer Assignment Workflow

### 4.1 Request Course Assignment

- **Endpoint:** `POST /course-assignments/request`
- **Role Required:** `LECTURER`
- **Description:** Lecturer requests to be assigned to teach a course offering.

**Payload:**

```json
{
  "courseOfferingId": "60d5ec4b868e5a2b3479427e",
  "role": "LEAD_LECTURER" // LEAD_LECTURER | CO_LECTURER | TA (Optional, default: LEAD_LECTURER)
}
```

**Returns (201):** The pending assignment object.

### 4.2 Review/Approve Lecturer Assignment

- **Endpoint:** `PATCH /course-assignments/:assignmentId/approve`
- **Role Required:** `HOD`
- **Description:** Head of Department approves or rejects a lecturer's teaching request.

**Payload:**

```json
{
  "status": "APPROVED" // APPROVED | REJECTED
}
```

**Returns (200):** The updated assignment object.

### 4.3 Get Pending Lecturer Assignments

- **Endpoint:** `GET /course-assignments/pending`
- **Role Required:** `HOD`
- **Description:** Get all assignment requests awaiting approval.

---

## 5. Student Enrollment Flow

### 5.1 Register/Enroll in Courses

- **Endpoint:** `POST /course-enrollments/register`
- **Role Required:** `STUDENT`
- **Description:** Registers the student for a list of course offerings.
- **Validation Rules:**
  - Student must have a `level` field set in their profile.
  - The course level must be less than or equal to the student's current level (students can register for their own level courses or lower level carryovers; higher level courses will be rejected).
  - Enrollment is **automatically approved** (status becomes `ENROLLED` instantly).

**Payload:**

```json
{
  "courseOfferingIds": [
    "60d5ec4b868e5a2b3479427e",
    "60d5ec4b868e5a2b3479427f"
  ]
}
```

**Returns (201):**

```json
{
  "status": "success",
  "enrollments": [
    {
      "id": "60d5ec4b868e5a2b34794280",
      "studentId": "...",
      "courseOfferingId": "60d5ec4b868e5a2b3479427e",
      "status": "ENROLLED",
      "tenantId": "...",
      "createdAt": "..."
    }
  ]
}
```

### 5.2 Get Registered Courses

- **Endpoint:** `GET /course-enrollments/my-courses`
- **Role Required:** `STUDENT`
- **Description:** Get all course offerings the authenticated student is currently registered for.

---

## 6. Lecturer Grading & Roster

### 6.1 View Student Roster

- **Endpoint:** `GET /course-offerings/:courseOfferingId/students`
- **Role Required:** `LECTURER` | `HOD` | `SCHOOL_ADMIN`
- **Description:** View all enrolled students in the offering along with their grade (if graded).
- **Security Check:** If called by a `LECTURER`, they must be an approved lecturer assigned to this offering.

**Returns (200):**

```json
{
  "status": "success",
  "students": [
    {
      "id": "60d5ec4b868e5a2b3479427f",
      "firstName": "Ade",
      "lastName": "Olu",
      "email": "ade@example.com",
      "level": 300,
      "grade": 85 // Float or null if not yet graded
    }
  ]
}
```

### 6.2 Submit or Update Grades

- **Endpoint:** `POST /course-offerings/:courseOfferingId/grades`
- **Role Required:** `LECTURER`
- **Description:** Submit or update scores (0-100) for one or more enrolled students.
- **Security Check:** Lecturer must be approved and assigned to this offering.

**Payload:**

```json
{
  "grades": [
    {
      "studentId": "60d5ec4b868e5a2b3479427f",
      "score": 88.5
    }
  ]
}
```

**Returns (200):** List of created/updated grade records.
