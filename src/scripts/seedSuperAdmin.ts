import prisma from '../configs/prismaConfig';
import { hashPassword } from '../modules/auth/authSecurity';

async function seedSuperAdmin() {
  console.log('Seeding Super Admin account...');

  const superAdminEmail = 'super@uniplug.com';
  const superAdminPassword = 'SuperAdmin123!';
  const hashedPassword = await hashPassword(superAdminPassword);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      firstName: 'System',
      lastName: 'SuperAdmin',
      email: superAdminEmail,
      adminId: 'UNI-SUPER-ADMIN-01',
      phoneNumber: '08000000000',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      approvalStatus: 'VERIFIED',
    },
  });

  console.log('\n=============================================');
  console.log('Super Admin Created Successfully ✔');
  console.log('=============================================');
  console.log(`Database _id    : ${superAdmin.id}`);
  console.log(`Login Email     : ${superAdminEmail}`);
  console.log(`Login Password  : ${superAdminPassword}`);
  console.log('=============================================\n');
}

seedSuperAdmin()
  .catch((e) => {
    console.error('Error seeding super admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
