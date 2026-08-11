import prisma from '../configs/prismaConfig';
import { runStudentLevelProgressionEngine } from '../modules/admin/adminService';
import { buildRichUserProfile } from '../modules/auth/authService';

async function runTests() {
  console.log('=== Starting Progression Engine & Profile Enrichment Tests ===\n');

  try {
    // 1. Find or verify tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('No tenant found in DB, skipping live DB test.');
      return;
    }
    console.log(`Testing with Tenant: ${tenant.schoolName} (${tenant.id})`);

    // 2. Find sessions for tenant
    const sessions = await prisma.academicSession.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`Found ${sessions.length} sessions for tenant.`);

    // 3. Test buildRichUserProfile on first student or user
    const studentUser = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: 'STUDENT' },
    });

    if (studentUser) {
      console.log(`\nTesting buildRichUserProfile for student: ${studentUser.email} (ID: ${studentUser.id})`);
      const profile = await buildRichUserProfile(studentUser.id);
      console.log('Student Profile Object Keys:', Object.keys(profile));
      console.log('Contains staffId?', 'staffId' in profile); // Expected: false
      console.log('Contains matricNumber?', 'matricNumber' in profile); // Expected: true
      console.log('Contains level?', 'level' in profile); // Expected: true
      console.log('Contains programmeEnrollment?', 'programmeEnrollment' in profile); // Expected: true
      console.log('Student Full JSON Payload:\n', JSON.stringify(profile, null, 2));
    } else {
      console.log('No student user found in tenant.');
    }

    const staffUser = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: { in: ['LECTURER', 'HOD', 'SCHOOL_ADMIN'] } },
    });

    if (staffUser) {
      console.log(`\nTesting buildRichUserProfile for staff: ${staffUser.email} (Role: ${staffUser.role})`);
      const staffProfile = await buildRichUserProfile(staffUser.id);
      console.log('Staff Profile Object Keys:', Object.keys(staffProfile));
      console.log('Contains staffId?', 'staffId' in staffProfile); // Expected: true
      console.log('Contains matricNumber?', 'matricNumber' in staffProfile); // Expected: false
      console.log('Contains level?', 'level' in staffProfile); // Expected: false
      console.log('Contains programmeEnrollment?', 'programmeEnrollment' in staffProfile); // Expected: false
      console.log('Staff Full JSON Payload:\n', JSON.stringify(staffProfile, null, 2));
    }

    if (sessions.length > 0) {
      const activeSession = sessions.find((s) => s.isActive) || sessions[0];
      console.log(`\nTesting Progression Engine for Session: ${activeSession.name} (${activeSession.id})`);
      const progressionSummary = await runStudentLevelProgressionEngine(tenant.id, activeSession.id);
      console.log('Progression Summary Result:', progressionSummary);

      // Testing Idempotency: Running it a second time for the same session should result in 0 new promotions and all skipped
      console.log('\nTesting Idempotency (running second time for same session)...');
      const secondRunSummary = await runStudentLevelProgressionEngine(tenant.id, activeSession.id);
      console.log('Second Run Summary (Idempotent):', secondRunSummary);
    }

    console.log('\n=== All Tests Completed Successfully! ===');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
