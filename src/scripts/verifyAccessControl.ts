import { AccessGroups, getRolesForGroup } from '../configs/rolesConfig';
import { requireRole, requireAccessGroup, ROLES, AllowedRole } from '../middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';

// Mock helper to run middleware
function testMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  userRole?: string,
): { passed: boolean; statusCode?: number; errorMessage?: string } {
  let passed = false;
  let statusCode: number | undefined;
  let errorMessage: string | undefined;

  const req = {} as Request;
  const res = {
    locals: {
      user: userRole ? { role: userRole as AllowedRole } : undefined,
    },
  } as unknown as Response;

  const next: NextFunction = (err?: any) => {
    if (err) {
      passed = false;
      statusCode = err.status || err.statusCode;
      errorMessage = err.message;
    } else {
      passed = true;
    }
  };

  middleware(req, res, next);
  return { passed, statusCode, errorMessage };
}

function runVerification() {
  console.log('=== Step 1 Verification: Centralized Access Control & Role Groups ===\n');

  let failedTests = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failedTests++;
    }
  }

  // 1. Verify AccessGroups configuration structure
  assert(
    AccessGroups.FINANCE_OPERATIONS.includes(ROLES.FINANCE_OFFICER) &&
    AccessGroups.FINANCE_OPERATIONS.includes(ROLES.SCHOOL_ADMIN) &&
    AccessGroups.FINANCE_OPERATIONS.includes(ROLES.SUPER_ADMIN),
    'AccessGroups.FINANCE_OPERATIONS contains FINANCE_OFFICER, SCHOOL_ADMIN, and SUPER_ADMIN',
  );

  assert(
    !AccessGroups.FINANCE_OPERATIONS.includes(ROLES.STUDENT as any) &&
    !AccessGroups.FINANCE_OPERATIONS.includes(ROLES.LECTURER as any),
    'AccessGroups.FINANCE_OPERATIONS excludes STUDENT and LECTURER',
  );

  assert(
    AccessGroups.EXAMINATION_AND_RECORDS.includes(ROLES.EXAMINATION_OFFICER) &&
    AccessGroups.EXAMINATION_AND_RECORDS.includes(ROLES.SCHOOL_ADMIN) &&
    AccessGroups.EXAMINATION_AND_RECORDS.includes(ROLES.SUPER_ADMIN),
    'AccessGroups.EXAMINATION_AND_RECORDS contains EXAMINATION_OFFICER, SCHOOL_ADMIN, and SUPER_ADMIN',
  );

  assert(
    !AccessGroups.EXAMINATION_AND_RECORDS.includes(ROLES.STUDENT as any) &&
    !AccessGroups.EXAMINATION_AND_RECORDS.includes(ROLES.FINANCE_OFFICER as any),
    'AccessGroups.EXAMINATION_AND_RECORDS excludes STUDENT and FINANCE_OFFICER',
  );

  // 2. Test requireRole with AccessGroups.FINANCE_OPERATIONS
  const financeMiddleware = requireRole(AccessGroups.FINANCE_OPERATIONS);

  const finAllow1 = testMiddleware(financeMiddleware, ROLES.FINANCE_OFFICER);
  assert(finAllow1.passed, 'Finance Officer is allowed to access Finance Operations');

  const finAllow2 = testMiddleware(financeMiddleware, ROLES.SCHOOL_ADMIN);
  assert(finAllow2.passed, 'School Admin is allowed to access Finance Operations');

  const finAllow3 = testMiddleware(financeMiddleware, ROLES.SUPER_ADMIN);
  assert(finAllow3.passed, 'Super Admin is allowed to access Finance Operations');

  const finDeny1 = testMiddleware(financeMiddleware, ROLES.STUDENT);
  assert(!finDeny1.passed && finDeny1.statusCode === 403, 'Student is blocked with 403 from Finance Operations');

  const finDeny2 = testMiddleware(financeMiddleware, ROLES.LECTURER);
  assert(!finDeny2.passed && finDeny2.statusCode === 403, 'Lecturer is blocked with 403 from Finance Operations');

  const finDeny3 = testMiddleware(financeMiddleware, ROLES.EXAMINATION_OFFICER);
  assert(!finDeny3.passed && finDeny3.statusCode === 403, 'Exam Officer is blocked with 403 from Finance Operations');

  // 3. Test requireAccessGroup helper with AccessGroups.EXAMINATION_AND_RECORDS
  const examMiddleware = requireAccessGroup(AccessGroups.EXAMINATION_AND_RECORDS);

  const examAllow1 = testMiddleware(examMiddleware, ROLES.EXAMINATION_OFFICER);
  assert(examAllow1.passed, 'Exam Officer is allowed to access Exam & Records Operations');

  const examAllow2 = testMiddleware(examMiddleware, ROLES.SCHOOL_ADMIN);
  assert(examAllow2.passed, 'School Admin is allowed to access Exam & Records Operations');

  const examDeny1 = testMiddleware(examMiddleware, ROLES.STUDENT);
  assert(!examDeny1.passed && examDeny1.statusCode === 403, 'Student is blocked with 403 from Exam & Records');

  const examDeny2 = testMiddleware(examMiddleware, ROLES.FINANCE_OFFICER);
  assert(!examDeny2.passed && examDeny2.statusCode === 403, 'Finance Officer is blocked with 403 from Exam & Records');

  // 4. Test Course Results View (includes Lecturer, HOD, School Admin, and Exam Officer)
  const resultsViewMiddleware = requireRole(AccessGroups.COURSE_RESULTS_VIEW);
  assert(testMiddleware(resultsViewMiddleware, ROLES.EXAMINATION_OFFICER).passed, 'Exam Officer can view course offering results');
  assert(testMiddleware(resultsViewMiddleware, ROLES.HOD).passed, 'HOD can view course offering results');
  assert(testMiddleware(resultsViewMiddleware, ROLES.LECTURER).passed, 'Lecturer can view course offering results');
  assert(!testMiddleware(resultsViewMiddleware, ROLES.STUDENT).passed, 'Student is blocked from unpublished course offering results roster');

  console.log(`\nVerification finished with ${failedTests} failure(s).`);
  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification();
