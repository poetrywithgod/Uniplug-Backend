# Project Charter

1. Project Title
Uniplug - Multi-Tenant eCampus Management Platform
2. Project Background and Rationale
Higher institutions increasingly require unified, digital platforms
to manage academic, administrative, and financial activities.
Existing systems are often siloed, institution-specific, and lack
interoperability, scalability, and modern user experience.
The proposed Multi-Tenant eCampus Platform is designed as a
centralized yet institutionally independent system where multiple
universities operate under a single platform while maintaining full
autonomy over their data, processes, and configurations. The
platform also extends beyond internal campus operations to support
admissions, scholarships, parent engagement, and external
organizations offering academic programs.
3. Project Purpose
The purpose of this project is to design and implement a scalable,
secure, and extensible eCampus platform that:
    ● Hosts multiple universities (tenants) on a single
       infrastructure
    ● Digitizes end-to-end academic and administrative workflows
    ● Improves accessibility for students, parents, institutions,
       and external organizations
    ● Enables transparent financial and academic operations
4. Project Objectives
Primary Objectives
    ● Build a multi-tenant architecture where each university
       operates independently
    ● Provide a centralized application and admission system for
       applicants
    ● Enable full academic lifecycle management (registration,
       grading, results, fees)
    ● Support parental access and financial participation


Secondary Objectives
● Enable scholarship discovery and applications
● Allow third-party organizations to publish academic programs
● Ensure secure, role-based access control
● Provide auditability and compliance-ready reporting

5. Project Scope
In-Scope
Platform-Level (Global)
    ● Multi-tenant onboarding and management of universities
    ● Central applicant portal (apply to multiple institutions)
    ● Scholarship and program feeds (public and private)
    ● Identity and access management (IAM)
    ● Notifications (email, in-app, SMS – optional)
    ● Payment gateway integration with tenant-level settlement
    ● Analytics and reporting dashboard
University-Level (Tenant)
    ● Admissions management (applications, screening, offers)
    ● Student enrollment and profile management
    ● Course registration and academic calendar
    ● Results posting, grading, and transcripts
    ● Fee configuration and collections
    ● Hostel and accommodation management (hostels, rooms, bed
       spaces, allocation, pricing)
    ● Department, faculty, and staff management
    ● Role-based permissions (admin, lecturer, finance, hostel
       manager, etc.)
Student
    ● Application to institutions
    ● Course registration
    ● Academic record viewing (results, GPA, transcripts)
    ● Fee payments
    ● Hostel booking, rent payment, and renewal
    ● Scholarship applications
    ● Notifications and announcements


Parent
● Parent/guardian account registration
● Unlimited dependent/student linkage (subject to student
approval)
● Viewing academic progress and hostel status
● Making approved payments on behalf of students
● Notifications related to student performance, accommodation,
and financial obligations
External Organizations
● Organization onboarding
● Uploading programs and opportunities
● Visibility controls (public vs institution-private)
● Application management for their programs
Out-of-Scope (Initial Phase)
● Physical access control (ID cards, biometrics)
● Learning Management System (LMS) content delivery (optional
future phase)
● Alumni employment marketplace (future roadmap)

6. Key Stakeholders
Internal Stakeholders
    ● Product Owner
    ● Senior Project Manager
    ● Engineering Team
    ● UI/UX Designers
    ● QA/Test Engineers
External Stakeholders
    ● University Administrators
    ● Academic Staff
    ● Students
    ● Parents/Guardians
    ● Scholarship Bodies
    ● External Educational Organizations
    ● Payment Service Providers


7. Assumptions and Constraints
Assumptions
    ● Universities are willing to operate under a shared platform
    ● Internet access is available to end users
    ● Institutions maintain their own financial accounts
Constraints
    ● Data isolation and privacy between tenants is mandatory
    ● Regulatory compliance (education and financial regulations)
    ● Scalability to support thousands of concurrent users
8. High-Level Risks
    ● Data leakage across tenants
    ● Payment settlement failures
    ● User adoption resistance from institutions
    ● Regulatory changes affecting education or payments
9. Success Criteria
    ● Successful onboarding of multiple universities
    ● Secure isolation of tenant data
    ● End-to-end academic operations completed digitally
    ● High availability and performance
    ● Positive user adoption metrics (students, parents,
       institutions)
10. High-Level Timeline (Indicative)
    ● Discovery & Planning
    ● MVP Definition
    ● Design (UX & Architecture)
    ● MVP Development
    ● Pilot with Selected Institutions
    ● Iteration & Scale
11. Approval
This charter authorizes the initiation of the Multi-Tenant eCampus
Platform project and provides high-level guidance for subsequent
planning and execution documents.