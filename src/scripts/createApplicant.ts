import prisma from '../configs/prismaConfig';
import { hashPassword } from '../modules/auth/authSecurity';

async function run() {
  const email = 'unilag.applicant@uniplug.com';
  const plainPassword = 'Password123!';
  const passwordHash = await hashPassword(plainPassword);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("Applicant already exists, deleting and recreating...");
    await prisma.user.delete({
      where: { id: existingUser.id },
    });
  }

  const user = await prisma.user.create({
    data: {
      firstName: 'Lagos',
      lastName: 'Applicant',
      email,
      role: 'APPLICANT',
      isVerified: true,
      tenantId: '6a4a9ebaa2d432709f6dff9b',
      schoolId: 'UOL-215',
      school: 'University of Lagos',
      credential: {
        create: {
          passwordHash,
        },
      },
    },
  });

  console.log("Applicant created successfully!");
  console.log("Credentials:");
  console.log(`Email: ${email}`);
  console.log(`Password: ${plainPassword}`);
  console.log(`Tenant/School: University of Lagos`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
