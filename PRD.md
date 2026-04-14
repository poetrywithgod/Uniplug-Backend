# Product Requirements Document

# (PRD) – Uniplug

## 1. Overview

Product Name: Uniplug
Type: Multi-Tenant eCampus Management Platform
Purpose: To provide a centralized, scalable platform for
universities to manage academic, financial, and hostel operations,
while offering students, parents, applicants, and external
organizations an integrated ecosystem.
Goals:
● Streamline university operations
● Improve applicant/student experience
● Enable multi-tenant scalability
● Ensure data integrity, security, and auditability

## 2. User Roles

1. Applicant / Prospective Student
2. Student
3. Parent / Sponsor
4. Lecturer / Academic Staff
5. University Admin / Tenant Admin
6. Finance Officer
7. Hostel Manager
8. External Organization Admin
9. Super Admin (Platform Level)

## 3. Functional Requirements

### 3.1 Applicant

```
● Sign-up/login and profile management
● Browse universities and public programs/scholarships
● Apply for universities and programs
● Upload documents
```

```
● Track application status
● Pay application fees
● Download printable receipts
```
### 3.2 Student

```
● Complete and verify profile
● Register for courses (core/elective with lecturers displayed)
● Pay tuition, departmental, hostel, and other fees
● Download printable receipts
● View grades, GPA, and academic records
● Hostel booking and renewal
● Notifications for deadlines, results, and payments
```
### 3.3 Parent / Sponsor

```
● Sign-up/login
● Link to unlimited students
● Monitor academic progress
● Make payments on behalf of students
● Access printable receipts
● Monitor hostel bookings
```
### 3.4 Lecturer / Academic Staff

```
● View assigned courses
● Access student lists with levels, carry-over indicators, and
progress
● Enter continuous assessment scores
● Enter exam scores
● Automatic grade and GPA computation
● Submit results for approval
● Receive notifications
```
### 3.5 University Admin / Tenant

```
● Manage academic sessions and semesters
● Configure faculties, programs, and courses
● Assign lecturers to courses
● Approve/reject student applications
● Approve results
● Configure fees
● Manage hostel setup and occupancy
● Publish scholarships and programs
● Generate reports (admissions, financial, academic, hostel)
● Broadcast notifications
```

### 3.6 Finance & Payment

```
● Online payment integration
● Tuition, hostel, and other fee payments
● Printable receipt generation
● Financial dashboards
● Audit logs
```
### 3.7 Hostel Management

```
● Real-time hostel, room, and bed-space availability
● Bookings and renewals
● Occupancy tracking
```
### 3.8 External Organization Admin

```
● Publish public/private programs
● Review applications
● Track beneficiaries
```
### 3.9 Super Admin

```
● Tenant onboarding and configuration
● Assign university admins
● Monitor platform-wide usage and activity logs
● Multi-tenant governance
```
## 4. Non-Functional Requirements

```
● Multi-tenant isolation
● Scalability to support multiple universities and thousands of
users
● Secure authentication and role-based access control
● Payment gateway integration with secure transactions
● Printable receipts with audit trails
● High availability, especially during peak registration and
payment periods
● Data privacy compliance
● Notification system for users
```

## 5. System Workflows

```
● Applicant → Admission → Student conversion
● Student course registration, fee payment, hostel booking,
results viewing
● Parent/Sponsor linking and payment on behalf of students
● Lecturer course management and grading
● University admin operations (sessions, programs, courses,
lecturer assignments, approvals)
● Payment processing and receipt issuance
● Hostel booking and renewal management
```
## 6. Success Criteria

```
● Fully functional MVP deployed for initial tenant(s)
● Accurate academic, financial, and hostel data management
● Multi-user roles operate correctly with defined permissions
● Payments are processed and receipts issued instantly
● All user flows verified and tested
● Scalable architecture to support additional universities
```
## 7. Constraints

```
● MVP does not include AI recommendations, offline mobile mode,
social features, or multi-currency support
● Limited analytics and reporting in MVP
● Refunds and adjustments handled manually in MVP
```
## 8. Notes

```
● Subsequent phases will add advanced analytics, integrations,
mobile offline features, social engagement, and automated
notifications for scholarships and programs.
● All workflows must adhere to tenant isolation and data privacy
rules.
```

