import prisma from '../configs/prismaConfig';
import { hashPassword } from '../modules/auth/authSecurity';
import { Role } from '../../generated/prisma';

async function main() {
  console.log('Seeding mock tenant...');

  // Create a mock tenant
  const tenant = await prisma.tenant.upsert({
    where: { schoolId: 'DEMO-UNI-01' },
    update: {},
    create: {
      schoolName: 'Demo University',
      schoolId: 'DEMO-UNI-01',
      email: 'admissions@demouni.edu.ng',
      school: 'Demo Uni',
      address: '123 Education Avenue, Lagos, Nigeria',
      postalCode: '100001',
      isActive: true,
    },
  });

  const adminEmail = 'admin@demouni.edu.ng';
  const hashedPassword = await hashPassword('AdminPassword123!');

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firstName: 'System',
      lastName: 'Admin',
      email: adminEmail,
      phoneNumber: '08012345678',
      passwordHash: hashedPassword,
      role: Role.SCHOOL_ADMIN,
      isVerified: true,
      approvalStatus: 'VERIFIED',
      schoolId: tenant.schoolId,
      school: tenant.schoolName,
      tenantId: tenant.id,
    },
  });

  console.log('\n=============================================');
  console.log('Mock Tenant & Admin Created Successfully ✔');
  console.log('=============================================');
  console.log(`Tenant Database _id: ${tenant.id}`);
  console.log(`Tenant School ID   : ${tenant.schoolId}`);
  console.log(`Tenant Name        : ${tenant.schoolName}`);
  console.log('');
  console.log(`Admin Login Email  : ${adminUser.email}`);
  console.log('Admin Password     : AdminPassword123!');
  console.log('=============================================\n');
  console.log(
    'Frontend Tip: Use the "Tenant Database _id" as the `schoolId` parameter when calling the Start Application endpoint.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
