import {
  publishOfferingResultsSchema,
  flagDiscrepancySchema,
  requestTranscriptSchema,
  adjudicateTranscriptSchema,
} from '../modules/examRecords/examRecordsSchemas';
import {
  computeTranscriptHash,
  getDegreeClassification,
  generateOfficialTranscriptPDF,
} from '../utils/transcriptPdfGenerator';
import { examRecordsService } from '../modules/examRecords/examRecordsService';

async function runExamRecordsVerification() {
  console.log('=== Step 4 Verification: Examination & Records Module ===\n');

  let failedTests = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failedTests++;
    }
  }

  // 1. Schema Validation
  console.log('--- 1. Testing Exam Records Schemas ---');
  const validRequest = requestTranscriptSchema.safeParse({
    type: 'OFFICIAL',
    recipientName: 'School of Graduate Studies, University of Cambridge',
    recipientEmail: 'admissions@cam.ac.uk',
    purpose: 'Postgraduate M.Phil Admission',
  });
  assert(validRequest.success, 'Valid transcript request payload passes validation');

  const invalidRequest = requestTranscriptSchema.safeParse({
    recipientName: 'A', // too short
    purpose: 'X',
  });
  assert(!invalidRequest.success, 'Short recipient name and purpose fail validation');

  const validDiscrepancy = flagDiscrepancySchema.safeParse({
    reason: 'Continuous assessment score of 35 exceeds institutional maximum of 30',
  });
  assert(validDiscrepancy.success, 'Valid discrepancy explanation passes validation');

  // 2. Transcript Utility & Math
  console.log('\n--- 2. Testing Degree Classification & Security Hash ---');
  assert(getDegreeClassification(4.75) === 'First Class Honours', 'CGPA 4.75 yields First Class Honours');
  assert(getDegreeClassification(3.82) === 'Second Class Honours (Upper Division)', 'CGPA 3.82 yields Second Class Upper');
  assert(getDegreeClassification(2.91) === 'Second Class Honours (Lower Division)', 'CGPA 2.91 yields Second Class Lower');
  assert(getDegreeClassification(1.85) === 'Third Class Honours', 'CGPA 1.85 yields Third Class');
  assert(getDegreeClassification(0.85) === 'Fail', 'CGPA 0.85 yields Fail');

  const testHash = computeTranscriptHash({
    matricNo: 'UNILAG/CSC/2026/0001',
    cgpa: 4.55,
    totalEarnedUnits: 142,
    coursesSnapshot: '[]',
  });
  assert(typeof testHash === 'string' && testHash.length === 64, 'computeTranscriptHash produces 64-character SHA-256 string');

  // 3. Official PDF Generation Test
  console.log('\n--- 3. Testing Official Transcript PDF Generation ---');
  try {
    const { pdfBuffer } = await generateOfficialTranscriptPDF({
      studentName: 'Chinedu Adeleke',
      matricNo: 'UNILAG/CSC/2026/0001',
      schoolName: 'University of Lagos',
      programmeName: 'B.Sc. Computer Science',
      departmentName: 'Computer Sciences',
      cgpa: 4.55,
      degreeClass: 'First Class Honours',
      totalEarnedUnits: 142,
      verificationCode: 'TRX-TEST-9981',
      verificationHash: testHash,
      dateIssued: new Date(),
      semesters: [
        {
          session: '2024/2025',
          semester: 'FIRST_SEMESTER',
          gpa: 4.67,
          courses: [
            {
              courseCode: 'CSC 101',
              courseName: 'Introduction to Computer Science',
              creditUnits: 3,
              letterGrade: 'A',
              gradePoint: 5,
            },
            {
              courseCode: 'MTH 101',
              courseName: 'Elementary Mathematics I',
              creditUnits: 3,
              letterGrade: 'B',
              gradePoint: 4,
            },
          ],
        },
      ],
    });

    assert(Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 1000, `PDF generated successfully (${pdfBuffer.length} bytes)`);
  } catch (err: any) {
    assert(false, `PDF Generation failed: ${err.message}`);
  }

  // 4. Service Methods
  console.log('\n--- 4. Testing ExamRecordsService Methods ---');
  assert(typeof examRecordsService.getAcademicWorkflowOverview === 'function', 'examRecordsService.getAcademicWorkflowOverview exists');
  assert(typeof examRecordsService.getCourseResultBatches === 'function', 'examRecordsService.getCourseResultBatches exists');
  assert(typeof examRecordsService.publishOfferingResults === 'function', 'examRecordsService.publishOfferingResults exists');
  assert(typeof examRecordsService.flagResultDiscrepancy === 'function', 'examRecordsService.flagResultDiscrepancy exists');
  assert(typeof examRecordsService.getStudentAcademicAudit === 'function', 'examRecordsService.getStudentAcademicAudit exists');
  assert(typeof examRecordsService.runGraduationCohortAudit === 'function', 'examRecordsService.runGraduationCohortAudit exists');
  assert(typeof examRecordsService.requestTranscript === 'function', 'examRecordsService.requestTranscript exists');
  assert(typeof examRecordsService.getTranscriptRequests === 'function', 'examRecordsService.getTranscriptRequests exists');
  assert(typeof examRecordsService.issueOfficialTranscript === 'function', 'examRecordsService.issueOfficialTranscript exists');
  assert(typeof examRecordsService.verifyTranscriptByCode === 'function', 'examRecordsService.verifyTranscriptByCode exists');

  console.log(`\nVerification finished with ${failedTests} failure(s).`);
  if (failedTests > 0) {
    process.exit(1);
  }
}

runExamRecordsVerification();
