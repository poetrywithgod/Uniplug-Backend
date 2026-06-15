# COURSE MANAGEMENT ARCHITECTURE

## Overview

This document defines the architecture for course creation, lecturer assignment, student enrollment, session management, attendance, grading, and future scalability within the University Management System.

The goal is to keep Courses independent from Lecturers, making the system flexible, maintainable, and scalable.

---

# Core Roles

## Super Admin

Responsibilities:

* Create Institutions
* Create Faculties
* Create Departments
* Assign HODs
* Manage system-wide configurations

---

## HOD (Head of Department)

Responsibilities:

* Create Courses within their Department
* Manage Course Offerings
* Approve Lecturer Assignments
* Monitor Department Academic Activities

Restrictions:

* Cannot create students
* Cannot modify courses outside their department

---

## Lecturer

Responsibilities:

* Request assignment to Courses
* Manage assigned Courses
* Create Class Sessions
* Upload Course Materials
* Record Attendance
* Manage Assessments
* Submit Grades

Restrictions:

* Cannot create Courses
* Cannot assign themselves directly without approval

---

# Recommended Academic Structure

Instead of:

Department
→ Course
→ Lecturer

Use:

Department
→ Course
→ Course Offering
→ Lecturer Assignment
→ Student Enrollment

This approach mirrors how most universities operate.

---

# Why Course Offerings Exist

A course exists forever.

Example:

CSC301 - Data Structures & Algorithms

However, every academic session creates a new instance of that course.

Examples:

CSC301
→ 2025/2026 First Semester

CSC301
→ 2025/2026 Second Semester

CSC301
→ 2026/2027 First Semester

These are Course Offerings.

Benefits:

* Historical records remain intact.
* Different lecturers can teach the same course in different semesters.
* Students can retake courses.
* Attendance and grades remain tied to the correct semester.

---

# Database Design

---

## Departments

```sql
departments
```

| Field      | Type      |
| ---------- | --------- |
| id         | bigint    |
| faculty_id | bigint    |
| name       | varchar   |
| hod_id     | bigint    |
| created_at | timestamp |
| updated_at | timestamp |

---

## Courses

Master course definitions.

```sql
courses
```

| Field             | Type      |
| ----------------- | --------- |
| id                | bigint    |
| department_id     | bigint    |
| course_name       | varchar   |
| course_code       | varchar   |
| credit_units      | integer   |
| description       | text      |
| created_by_hod_id | bigint    |
| status            | varchar   |
| created_at        | timestamp |
| updated_at        | timestamp |

Example:

```json
{
  "course_name": "Data Structures & Algorithms",
  "course_code": "CSC301",
  "department_id": 1,
  "credit_units": 3
}
```

---

## Course Offerings

Specific semester/session instances.

```sql
course_offerings
```

| Field               | Type      |
| ------------------- | --------- |
| id                  | bigint    |
| course_id           | bigint    |
| academic_session_id | bigint    |
| semester_id         | bigint    |
| status              | varchar   |
| created_at          | timestamp |
| updated_at          | timestamp |

Example:

```json
{
  "course_id": 1,
  "academic_session": "2025/2026",
  "semester": "First Semester"
}
```

---

# Course Creation Workflow

## Step 1

HOD creates Course.

Input:

* Course Name
* Course Code
* Department
* Credit Units
* Description

Example:

```json
{
  "course_name": "Artificial Intelligence",
  "course_code": "CSC401",
  "department_id": 1,
  "credit_units": 3
}
```

---

## Step 2

System creates Course.

Status:

```text
ACTIVE
```

---

## Step 3

HOD creates Course Offering.

Example:

```json
{
  "course_id": 1,
  "academic_session": "2025/2026",
  "semester": "First Semester"
}
```

Result:

CSC401 now becomes available for lecturers and students within that semester.

---

# Lecturer Assignment Architecture

## Recommended Approach

DO NOT assign lecturers during Course creation.

Instead:

1. Course Created
2. Course Offering Created
3. Lecturer Requests Assignment
4. HOD Approves Assignment

This creates a cleaner workflow.

---

# Lecturer Assignment Workflow

## Lecturer View

Lecturer sees available offerings.

Example:

* CSC301 - Data Structures
* CSC401 - Artificial Intelligence
* CSC201 - Programming I

Actions:

```text
Request Assignment
```

---

## HOD View

HOD receives request.

Example:

```text
John Doe requested assignment to CSC301
```

Actions:

* Approve
* Reject

---

## Course Assignment Table

```sql
course_assignments
```

| Field              | Type      |
| ------------------ | --------- |
| id                 | bigint    |
| course_offering_id | bigint    |
| lecturer_id        | bigint    |
| assigned_by        | bigint    |
| status             | varchar   |
| created_at         | timestamp |
| updated_at         | timestamp |

Status Values:

```text
PENDING
APPROVED
REJECTED
REMOVED
```

---

# Multiple Lecturers Support

The assignment structure supports:

* Main Lecturer
* Co-Lecturer
* Teaching Assistant

Future extension:

```sql
role
```

Values:

```text
LEAD_LECTURER
CO_LECTURER
TA
```

---

# Student Enrollment

Students should never be attached directly to lecturers.

Students belong to Course Offerings.

Correct Relationship:

Student
→ Course Offering

NOT:

Student
→ Lecturer

---

## Enrollment Table

```sql
course_enrollments
```

| Field              | Type      |
| ------------------ | --------- |
| id                 | bigint    |
| student_id         | bigint    |
| course_offering_id | bigint    |
| created_at         | timestamp |

---

# Lecturer Dashboard Features

After assignment approval, lecturers gain access to:

## Overview

* Total Students
* Attendance Rate
* Assessment Progress
* Upcoming Sessions
* Average Grade

---

## Students

View:

* Name
* Matric Number
* Department
* Attendance Percentage
* Current Grade

---

## Materials

Upload:

* PDF
* Slides
* Videos
* Assignments
* External Links

---

## Sessions

Create and manage class sessions.

---

# Session Architecture

Each class meeting is represented by a Session.

Examples:

* Week 1 Lecture
* Week 2 Lecture
* Lab Session
* Revision Session
* Project Defense

---

## Course Sessions Table

```sql
course_sessions
```

| Field              | Type      |
| ------------------ | --------- |
| id                 | bigint    |
| course_offering_id | bigint    |
| lecturer_id        | bigint    |
| title              | varchar   |
| description        | text      |
| session_date       | datetime  |
| duration_minutes   | integer   |
| status             | varchar   |
| created_at         | timestamp |
| updated_at         | timestamp |

Status:

```text
SCHEDULED
ONGOING
COMPLETED
CANCELLED
```

---

# Attendance Management

Attendance belongs to Sessions.

Relationship:

Course Offering
→ Session
→ Attendance Record

---

## Attendance Table

```sql
attendance_records
```

| Field         | Type      |
| ------------- | --------- |
| id            | bigint    |
| session_id    | bigint    |
| student_id    | bigint    |
| status        | varchar   |
| checked_in_at | timestamp |
| created_at    | timestamp |

Status Values:

```text
PRESENT
ABSENT
LATE
EXCUSED
```

---

# Course Materials

## Materials Table

```sql
course_materials
```

| Field              | Type      |
| ------------------ | --------- |
| id                 | bigint    |
| course_offering_id | bigint    |
| uploaded_by        | bigint    |
| title              | varchar   |
| description        | text      |
| file_url           | text      |
| created_at         | timestamp |

---

# Assessments

Assessment Types:

* Assignment
* Quiz
* Test
* Examination
* Project

---

## Assessments Table

```sql
assessments
```

| Field              | Type      |
| ------------------ | --------- |
| id                 | bigint    |
| course_offering_id | bigint    |
| title              | varchar   |
| type               | varchar   |
| total_score        | integer   |
| due_date           | datetime  |
| created_by         | bigint    |
| created_at         | timestamp |

---

## Assessment Submissions

```sql
assessment_submissions
```

| Field          | Type      |
| -------------- | --------- |
| id             | bigint    |
| assessment_id  | bigint    |
| student_id     | bigint    |
| submission_url | text      |
| submitted_at   | timestamp |

---

## Grades

```sql
grades
```

| Field         | Type      |
| ------------- | --------- |
| id            | bigint    |
| assessment_id | bigint    |
| student_id    | bigint    |
| score         | decimal   |
| graded_by     | bigint    |
| graded_at     | timestamp |

---

# Recommended Permissions

## HOD

Can:

* Create Courses
* Edit Courses
* Create Course Offerings
* Approve Lecturer Assignments
* View Department Analytics

Cannot:

* Grade Courses they are not teaching

---

## Lecturer

Can:

* Request Course Assignment
* Manage Assigned Courses
* Create Sessions
* Upload Materials
* Manage Attendance
* Create Assessments
* Grade Students

Cannot:

* Create Courses
* Create Course Offerings
* Approve Their Own Assignment

---

# Future Enhancements

## Teaching Assistants

Support assistant lecturers using assignment roles.

---

## Lecturer Workload Analytics

Track:

* Total Assigned Courses
* Total Students
* Weekly Teaching Hours
* Assessment Completion Rate

---

## Auto Assignment

Optional future feature.

During Course Offering creation:

HOD may assign a default lecturer immediately.

The approval workflow can still remain.

---

# Final Relationship Diagram

Faculty
│
└── Department
│
└── Course
│
└── Course Offering
│
├── Lecturer Assignments
│
├── Student Enrollments
│
├── Course Sessions
│
├── Course Materials
│
└── Assessments
│
└── Grades

---

# Architectural Principles

1. Courses are permanent definitions.
2. Course Offerings represent a semester-specific instance.
3. Students enroll in Course Offerings, not Courses.
4. Lecturers teach Course Offerings, not Courses.
5. Attendance belongs to Sessions.
6. Grades belong to Assessments.
7. HODs control course creation and lecturer approvals.
8. The design must support multiple lecturers per course offering.
9. Historical academic records must never be overwritten.
10. Every academic session should remain independently queryable.

```
```