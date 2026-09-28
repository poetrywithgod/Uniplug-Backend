import crypto from 'crypto';
import createError from 'http-errors';
import prisma from '../../configs/prismaConfig';
import { financeService } from '../finance/financeService';
import {
  computeTranscriptHash,
  generateOfficialTranscriptPDF,
  getDegreeClassification,
  TranscriptSemesterGroup,
} from '../../utils/transcriptPdfGenerator';
import {
  ClearanceEligibility,
  Semester,
  TranscriptRequestStatus,
  TranscriptType,
} from '../../../generated/prisma';

export interface ResultBatchesQuery {
  academicSession?: string;
  semester?: Semester;
  departmentId?: string;
  status?: string;
}

export interface RequestTranscriptInput {
  type?: TranscriptType;
  recipientName: string;
  recipientEmail?: string;
  deliveryAddress?: string;
  purpose: string;
}

export interface AdjudicateTranscriptInput {
  status: TranscriptRequestStatus;
  holdReason?: string;
}

export interface GraduationCohortQuery {
  academicSession?: string;
  departmentId?: string;
  status?: ClearanceEligibility;
}

export class ExamRecordsService {
  /**
   * High-level operational overview & academic KPIs for Examination Office.
   */
  async getAcademicWorkflowOverview(tenantId: string) {
    const [
      totalOfferings,
      publishedOfferings,
      pendingHODApproval,
      totalTranscriptsIssued,
      pendingTranscriptRequests,
      clearedGraduatesCount,
      recentBatches,
    ] = await Promise.all([
      prisma.courseOffering.count({ where: { tenantId } }),
      prisma.courseOffering.count({
        where: {
          tenantId,
          grades: { some: { isPublished: true } },
        },
      }),
      prisma.courseOffering.count({
        where: {
          tenantId,
          grades: { some: { status: 'PENDING_APPROVAL' } },
        },
      }),
      prisma.transcriptRequest.count({
        where: { tenantId, status: 'ISSUED' },
      }),
      prisma.transcriptRequest.count({
        where: {
          tenantId,
          status: { in: ['NEW', 'VERIFYING', 'READY_TO_ISSUE'] },
        },
      }),
      prisma.graduationAudit.count({
        where: { tenantId, status: 'CLEARED' },
      }),
      prisma.courseOffering.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          course: {
            include: { department: { select: { id: true, name: true } } },
          },
          grades: { select: { id: true, status: true, isApproved: true, isPublished: true } },
        },
      }),
    ]);

    return {
      kpis: {
        totalCourseOfferings: totalOfferings,
        publishedOfferingsCount: publishedOfferings,
        pendingHODApprovalCount: pendingHODApproval,
        transcriptsIssuedCount: totalTranscriptsIssued,
        pendingTranscriptRequestsCount: pendingTranscriptRequests,
        clearedGraduationCandidatesCount: clearedGraduatesCount,
      },
      recentBatches: recentBatches.map((b) => ({
        id: b.id,
        courseCode: b.course.courseCode,
        courseName: b.course.courseName,
        department: b.course.department.name,
        session: b.academicSession,
        semester: b.course.semester,
        totalGrades: b.grades.length,
        isPublished: b.grades.some((g) => g.isPublished),
      })),
    };
  }

  /**
   * Filter course result batches with the 3-Point Verification Checklist:
   * 1. 100% of enrolled students are graded.
   * 2. HOD has signed off on the grades.
   * 3. No scoring anomalies (CA <= 30, Exam <= 70, Total <= 100).
   */
  async getCourseResultBatches(tenantId: string, query: ResultBatchesQuery) {
    const where: any = { tenantId };

    if (query.academicSession) {
      where.academicSession = query.academicSession;
    }
    if (query.semester) {
      where.course = { ...where.course, semester: query.semester };
    }
    if (query.departmentId) {
      where.course = { ...where.course, departmentId: query.departmentId };
    }

    const offerings = await prisma.courseOffering.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: { department: { select: { id: true, name: true } } },
        },
        enrollments: { select: { id: true, studentId: true } },
        grades: {
          select: {
            id: true,
            caScore: true,
            examScore: true,
            score: true,
            status: true,
            isApproved: true,
            isPublished: true,
          },
        },
      },
    });

    const batches = offerings.map((offering) => {
      const enrolledCount = offering.enrollments.length;
      const gradedCount = offering.grades.length;

      // 3-Point Checklist Criteria
      const isFullyGraded = enrolledCount > 0 && gradedCount >= enrolledCount;
      const isHODSignedOff =
        gradedCount > 0 &&
        offering.grades.every((g) => g.isApproved === true || g.status === 'APPROVED' || g.status === 'HOD_APPROVED');
      const hasScoreAnomaly = offering.grades.some(
        (g) => (g.caScore ?? 0) > 30 || (g.examScore ?? 0) > 70 || g.score > 100 || g.score < 0,
      );
      const isPublished = gradedCount > 0 && offering.grades.every((g) => g.isPublished === true);

      let batchStatus = 'PENDING_HOD';
      if (hasScoreAnomaly) {
        batchStatus = 'DISCREPANCY';
      } else if (isPublished) {
        batchStatus = 'PUBLISHED';
      } else if (isHODSignedOff) {
        batchStatus = 'HOD_APPROVED';
      }

      return {
        courseOfferingId: offering.id,
        courseCode: offering.course.courseCode,
        courseName: offering.course.courseName,
        department: offering.course.department.name,
        session: offering.academicSession,
        semester: offering.course.semester,
        level: offering.course.level,
        enrolledCount,
        gradedCount,
        checklist: {
          criterion1_allGraded: isFullyGraded,
          criterion2_hodSignedOff: isHODSignedOff,
          criterion3_noScoreAnomalies: !hasScoreAnomaly,
          canPublish: isFullyGraded && isHODSignedOff && !hasScoreAnomaly && !isPublished,
        },
        batchStatus,
        isPublished,
      };
    });

    if (query.status) {
      return batches.filter((b) => b.batchStatus === query.status);
    }

    return batches;
  }

  /**
   * Release and publish verified course results to student portals & CGPA calculations.
   */
  async publishOfferingResults(
    tenantId: string,
    officerId: string,
    courseOfferingId: string,
    remarks?: string,
  ) {
    const offering = await prisma.courseOffering.findFirst({
      where: { id: courseOfferingId, tenantId },
      include: {
        enrollments: true,
        grades: true,
      },
    });

    if (!offering) {
      throw createError(404, 'Course offering not found.');
    }

    const enrolledCount = offering.enrollments.length;
    const gradedCount = offering.grades.length;

    // Strict 3-Point Checklist enforcement
    if (enrolledCount > 0 && gradedCount < enrolledCount) {
      throw createError(
        400,
        `Cannot publish: Only ${gradedCount} of ${enrolledCount} enrolled students have grades recorded.`,
      );
    }

    const hasScoreAnomaly = offering.grades.some(
      (g) => (g.caScore ?? 0) > 30 || (g.examScore ?? 0) > 70 || g.score > 100,
    );
    if (hasScoreAnomaly) {
      throw createError(400, 'Cannot publish: Batch contains Continuous Assessment or Exam score anomalies.');
    }

    const unapprovedCount = offering.grades.filter((g) => !g.isApproved).length;
    if (unapprovedCount > 0) {
      throw createError(400, `Cannot publish: ${unapprovedCount} grade(s) have not been signed off by the HOD.`);
    }

    // Publish all grades
    const now = new Date();
    const updateResult = await prisma.grade.updateMany({
      where: { courseOfferingId, tenantId },
      data: {
        status: 'PUBLISHED',
        isPublished: true,
        publishedById: officerId,
        publishedAt: now,
      },
    });

    return {
      courseOfferingId,
      publishedCount: updateResult.count,
      publishedAt: now,
      remarks: remarks || 'Officially verified and published by Examination & Records Board',
    };
  }

  /**
   * Flag score discrepancy and return batch to HOD with anomaly notes.
   */
  async flagResultDiscrepancy(
    tenantId: string,
    officerId: string,
    courseOfferingId: string,
    reason: string,
  ) {
    const offering = await prisma.courseOffering.findFirst({
      where: { id: courseOfferingId, tenantId },
    });

    if (!offering) {
      throw createError(404, 'Course offering not found.');
    }

    // Flag grades back to HOD
    await prisma.grade.updateMany({
      where: { courseOfferingId, tenantId },
      data: {
        status: 'REJECTED',
        isApproved: false,
        rejectionReason: `[Examination Office Discrepancy Flag]: ${reason}`,
      },
    });

    return {
      courseOfferingId,
      discrepancyReason: reason,
      flaggedBy: officerId,
      status: 'REJECTED',
    };
  }

  /**
   * Comprehensive historical academic audit for a student.
   */
  async getStudentAcademicAudit(tenantId: string, studentId: string) {
    const student = await prisma.user.findFirst({
      where: { id: studentId, tenantId, role: 'STUDENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        staffId: true,
        adminId: true,
        level: true,
        department: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw createError(404, 'Student academic profile not found.');
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId, tenantId, status: 'ENROLLED' },
      include: {
        courseOffering: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const grades = await prisma.grade.findMany({
      where: { studentId, tenantId },
    });
    const gradeMap = new Map(grades.map((g) => [g.courseOfferingId, g]));

    const sessionsMap = new Map<string, TranscriptSemesterGroup>();
    let cumulativeRegisteredUnits = 0;
    let cumulativeEarnedUnits = 0;
    let cumulativeGradePoints = 0;

    for (const e of enrollments) {
      const offering = e.courseOffering;
      const course = offering.course;
      const grade = gradeMap.get(offering.id);

      const groupKey = `${offering.academicSession}__${course.semester}`;
      if (!sessionsMap.has(groupKey)) {
        sessionsMap.set(groupKey, {
          session: offering.academicSession,
          semester: course.semester,
          gpa: 0,
          courses: [],
        });
      }

      const group = sessionsMap.get(groupKey)!;
      const isPublished = grade?.isPublished === true || grade?.status === 'PUBLISHED';

      if (isPublished && grade) {
        const units = course.creditUnits;
        const letter = grade.letterGrade || (grade.score >= 70 ? 'A' : grade.score >= 60 ? 'B' : grade.score >= 50 ? 'C' : grade.score >= 45 ? 'D' : grade.score >= 40 ? 'E' : 'F');
        const pointPerUnit = letter === 'A' ? 5 : letter === 'B' ? 4 : letter === 'C' ? 3 : letter === 'D' ? 2 : letter === 'E' ? 1 : 0;
        const points = units * pointPerUnit;

        cumulativeRegisteredUnits += units;
        cumulativeGradePoints += points;
        if (grade.score >= 40) {
          cumulativeEarnedUnits += units;
        }

        group.courses.push({
          courseCode: course.courseCode,
          courseName: course.courseName,
          creditUnits: units,
          letterGrade: letter,
          gradePoint: pointPerUnit,
        });
      }
    }

    const semesters = Array.from(sessionsMap.values()).map((s) => {
      const semRegistered = s.courses.reduce((sum, c) => sum + c.creditUnits, 0);
      const semPoints = s.courses.reduce((sum, c) => sum + c.creditUnits * c.gradePoint, 0);
      const gpa = semRegistered > 0 ? Number((semPoints / semRegistered).toFixed(2)) : 0;
      return { ...s, gpa };
    });

    const cgpa =
      cumulativeRegisteredUnits > 0
        ? Number((cumulativeGradePoints / cumulativeRegisteredUnits).toFixed(2))
        : 0;

    const matricNo = student.staffId || student.adminId || `STU-${student.id.substring(18)}`;

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        matricNo,
        email: student.email,
        level: student.level,
        department: student.department?.name || 'N/A',
      },
      academicSummary: {
        cumulativeRegisteredUnits,
        cumulativeEarnedUnits,
        cumulativeGradePoints,
        cgpa,
        degreeClass: getDegreeClassification(cgpa),
        totalSemesters: semesters.length,
      },
      semesters,
    };
  }

  /**
   * Run graduation audit for cohort candidates, checking credits, core courses, and financial holds.
   */
  async runGraduationCohortAudit(
    tenantId: string,
    officerId: string,
    academicSession?: string,
  ) {
    const session = academicSession || '2024/2025';

    // Find final-year candidates (level 400 or 500)
    const candidates = await prisma.user.findMany({
      where: {
        tenantId,
        role: 'STUDENT',
        level: { gte: 400 },
      },
      include: {
        department: true,
        programmeEnrollments: {
          include: { programme: true },
          take: 1,
        },
      },
    });

    const auditResults = [];

    for (const student of candidates) {
      const audit = await this.getStudentAcademicAudit(tenantId, student.id);
      const requiredCredits =
        student.programmeEnrollments[0]?.programme?.creditRequirement || 120;

      // Check for failed core courses
      const allGrades = await prisma.grade.findMany({
        where: { studentId: student.id, tenantId },
        include: { courseOffering: { include: { course: true } } },
      });

      const hasUnpassedCore = allGrades.some(
        (g) => g.courseOffering.course.category === 'CORE' && g.score < 40,
      );

      // Financial Hold Check using FinanceService
      const financialClearance = await financeService.getStudentFinancialClearanceStatus(
        tenantId,
        student.id,
      );
      const hasFinancialHold = !financialClearance.isCleared;

      // Evaluation
      let status: ClearanceEligibility = 'UNDER_REVIEW';
      const deficiencyNotes: string[] = [];

      if (audit.academicSummary.cumulativeEarnedUnits < requiredCredits) {
        deficiencyNotes.push(
          `Incomplete credits: Earned ${audit.academicSummary.cumulativeEarnedUnits}/${requiredCredits} units.`,
        );
      }
      if (hasUnpassedCore) {
        deficiencyNotes.push('Outstanding failed core/compulsory course(s).');
      }
      if (hasFinancialHold) {
        deficiencyNotes.push(`Financial hold: Outstanding debt balance of NGN ${financialClearance.balance.toLocaleString()}.`);
      }
      if (audit.academicSummary.cgpa < 1.0) {
        deficiencyNotes.push('CGPA below minimum graduation benchmark (1.00).');
      }

      if (deficiencyNotes.length === 0) {
        status = 'ELIGIBLE';
      } else {
        status = 'NOT_ELIGIBLE';
      }

      const record = await prisma.graduationAudit.upsert({
        where: {
          tenantId_studentId_academicSession: {
            tenantId,
            studentId: student.id,
            academicSession: session,
          },
        },
        create: {
          tenantId,
          studentId: student.id,
          academicSession: session,
          earnedCredits: audit.academicSummary.cumulativeEarnedUnits,
          requiredCredits,
          cgpa: audit.academicSummary.cgpa,
          hasUnpassedCore,
          hasFinancialHold,
          hasDisciplinaryHold: false,
          status,
          deficiencyNotes: deficiencyNotes.length ? deficiencyNotes.join(' ') : null,
          clearedBy: status === 'ELIGIBLE' ? officerId : null,
          clearedAt: status === 'ELIGIBLE' ? new Date() : null,
        },
        update: {
          earnedCredits: audit.academicSummary.cumulativeEarnedUnits,
          requiredCredits,
          cgpa: audit.academicSummary.cgpa,
          hasUnpassedCore,
          hasFinancialHold,
          status,
          deficiencyNotes: deficiencyNotes.length ? deficiencyNotes.join(' ') : null,
          clearedBy: status === 'ELIGIBLE' ? officerId : null,
          clearedAt: status === 'ELIGIBLE' ? new Date() : null,
        },
      });

      auditResults.push({
        student: audit.student,
        record,
      });
    }

    return auditResults;
  }

  /**
   * Request a transcript (called by Student or Admissions).
   */
  async requestTranscript(
    tenantId: string,
    studentId: string,
    payload: RequestTranscriptInput,
  ) {
    const student = await prisma.user.findFirst({
      where: { id: studentId, tenantId, role: 'STUDENT' },
    });

    if (!student) {
      throw createError(404, 'Student not found.');
    }

    // Generate unique verification code
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const verificationCode = `TRX-${randomHex}-${Date.now().toString().slice(-4)}`;

    // Check for pending unpublished grades
    const unapprovedGrades = await prisma.grade.count({
      where: {
        studentId,
        tenantId,
        OR: [{ isPublished: false }, { status: { not: 'PUBLISHED' } }],
      },
    });

    const holdReason = unapprovedGrades > 0
      ? `Integrity hold: ${unapprovedGrades} semester grade(s) are pending final Senate verification.`
      : null;

    const request = await prisma.transcriptRequest.create({
      data: {
        tenantId,
        studentId,
        type: payload.type || 'OFFICIAL',
        status: holdReason ? 'VERIFYING' : 'NEW',
        recipientName: payload.recipientName,
        recipientEmail: payload.recipientEmail,
        deliveryAddress: payload.deliveryAddress,
        purpose: payload.purpose,
        verificationCode,
        holdReason,
      },
    });

    return request;
  }

  /**
   * List transcript requests for Examination Office.
   */
  async getTranscriptRequests(tenantId: string, status?: TranscriptRequestStatus) {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    return prisma.transcriptRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            level: true,
            department: { select: { name: true } },
          },
        },
      },
    });
  }

  /**
   * Issue official verified transcript with tamper-proof SHA-256 hash & PDF.
   */
  async issueOfficialTranscript(tenantId: string, officerId: string, requestId: string) {
    const request = await prisma.transcriptRequest.findFirst({
      where: { id: requestId, tenantId },
      include: { student: { include: { department: true } } },
    });

    if (!request) {
      throw createError(404, 'Transcript request not found.');
    }

    // Check financial hold before releasing official transcript
    const clearance = await financeService.getStudentFinancialClearanceStatus(
      tenantId,
      request.studentId,
    );
    if (!clearance.isCleared) {
      throw createError(
        403,
        `Cannot issue transcript: Student has an active financial hold with an outstanding balance of NGN ${clearance.balance.toLocaleString()}.`,
      );
    }

    // Fetch complete verified academic audit
    const audit = await this.getStudentAcademicAudit(tenantId, request.studentId);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    // Compute cryptographic SHA-256 hash
    const coursesSnapshot = JSON.stringify(audit.semesters);
    const verificationHash = computeTranscriptHash({
      matricNo: audit.student.matricNo,
      cgpa: audit.academicSummary.cgpa,
      totalEarnedUnits: audit.academicSummary.cumulativeEarnedUnits,
      coursesSnapshot,
    });

    // Generate Official PDF
    const { pdfBuffer, fileUrl } = await generateOfficialTranscriptPDF({
      studentName: audit.student.name,
      matricNo: audit.student.matricNo,
      schoolName: tenant?.schoolName || 'University ERP',
      programmeName: request.student.department?.name || 'Academic Degree',
      departmentName: request.student.department?.name || 'Department',
      cgpa: audit.academicSummary.cgpa,
      degreeClass: audit.academicSummary.degreeClass,
      totalEarnedUnits: audit.academicSummary.cumulativeEarnedUnits,
      verificationCode: request.verificationCode,
      verificationHash,
      dateIssued: new Date(),
      semesters: audit.semesters,
    });

    // Update Request
    const updated = await prisma.transcriptRequest.update({
      where: { id: requestId },
      data: {
        status: 'ISSUED',
        verificationHash,
        pdfUrl: fileUrl || `https://assets.uniplug.net/transcripts/${request.verificationCode}.pdf`,
        issuedBy: officerId,
        issuedAt: new Date(),
      },
    });

    return {
      request: updated,
      pdfBuffer,
      fileUrl: updated.pdfUrl,
      verificationCode: request.verificationCode,
      verificationHash,
    };
  }

  /**
   * Public verification endpoint to authenticate any issued transcript by verificationCode.
   */
  async verifyTranscriptByCode(verificationCode: string) {
    const request = await prisma.transcriptRequest.findUnique({
      where: { verificationCode },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        tenant: {
          select: {
            schoolName: true,
            schoolId: true,
          },
        },
      },
    });

    if (!request || request.status !== 'ISSUED') {
      throw createError(404, 'No verified official transcript found with this verification code.');
    }

    return {
      status: 'VERIFIED',
      verificationCode: request.verificationCode,
      verificationHash: request.verificationHash,
      institution: request.tenant.schoolName,
      studentName: `${request.student.firstName} ${request.student.lastName}`.trim(),
      department: request.student.department?.name || 'Academic Degree',
      dateIssued: request.issuedAt,
      pdfUrl: request.pdfUrl,
    };
  }

  /**
   * Confer final academic graduation clearance on an individual student.
   * Only students with an ELIGIBLE audit record can be cleared.
   */
  async clearStudentForGraduation(
    tenantId: string,
    officerId: string,
    studentId: string,
    academicSession?: string,
  ) {
    const session = academicSession || '2024/2025';

    const student = await prisma.user.findFirst({
      where: { id: studentId, tenantId, role: 'STUDENT' },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!student) {
      throw createError(404, 'Student not found.');
    }

    const existingAudit = await prisma.graduationAudit.findUnique({
      where: {
        tenantId_studentId_academicSession: {
          tenantId,
          studentId,
          academicSession: session,
        },
      },
    });

    if (!existingAudit) {
      throw createError(
        400,
        'No graduation audit record found for this student. Run a cohort audit first.',
      );
    }

    if (existingAudit.status === 'CLEARED') {
      throw createError(409, 'Student has already been cleared for graduation.');
    }

    if (existingAudit.status !== 'ELIGIBLE') {
      throw createError(
        400,
        `Cannot clear student: Current status is "${existingAudit.status}". Student must be ELIGIBLE before clearance can be conferred.`,
      );
    }

    const updated = await prisma.graduationAudit.update({
      where: { id: existingAudit.id },
      data: {
        status: 'CLEARED',
        clearedBy: officerId,
        clearedAt: new Date(),
        deficiencyNotes: null,
      },
    });

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
      },
      academicSession: session,
      clearanceStatus: 'CLEARED',
      clearedBy: officerId,
      clearedAt: updated.clearedAt,
      auditRecord: updated,
    };
  }
}

export const examRecordsService = new ExamRecordsService();
