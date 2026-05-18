import prisma from '../configs/prismaConfig';

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

  console.log('\n=============================================');
  console.log('Mock Tenant Created Successfully ✔');
  console.log('=============================================');
  console.log(`Tenant Database _id: ${tenant.id}`);
  console.log(`Tenant School ID   : ${tenant.schoolId}`);
  console.log(`Tenant Name        : ${tenant.schoolName}`);
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
