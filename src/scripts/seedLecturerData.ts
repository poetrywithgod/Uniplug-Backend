import prisma from '../configs/prismaConfig';
import { hashPassword } from '../modules/auth/authSecurity';
import { loginUser } from '../modules/auth/authService';
import {
  getLecturerCourses,
  setCourseSchedule,
  setCourseSyllabus,
  addCourseMaterials,
  getEnrolledStudents,
  submitGrades,
} from '../modules/course/courseService';
import { Role, ApprovalStatus, CourseCategory } from '../../generated/prisma';

async function seedLecturerData() {
  console.log('--- Seeding Complete Lecturer Portal Data for University of Lagos ---');

  const tenantId = '6a4a9ebaa2d432709f6dff9b';
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Unilag tenant not found.');

  // 1. Department
  const department = await prisma.department.findFirst({
    where: { tenantId, name: { contains: 'Computer Science', mode: 'insensitive' } },
  });
  if (!department) throw new Error('Computer Science department not found.');

  // 2. Academic Session & Semester
  let session = await prisma.academicSession.findFirst({
    where: { tenantId, isActive: true },
    include: { semesters: true },
  });

  if (!session) {
    session = await prisma.academicSession.findFirst({
      where: { tenantId },
      include: { semesters: true },
    });
    if (session) {
      await prisma.academicSession.update({
        where: { id: session.id },
        data: { isActive: true },
      });
    }
  }

  const semesterName = 'First Semester';

  // 3. Lecturer Grace Hopper
  const lecturerEmail = 'lecturer.unilag@uniplug.com';
  const lecturerPassword = 'LecturerPassword123!';
  const hashedPassword = await hashPassword(lecturerPassword);

  const lecturer = await prisma.user.upsert({
    where: { email: lecturerEmail },
    update: {
      isVerified: true,
      approvalStatus: ApprovalStatus.VERIFIED,
      departmentId: department.id,
      tenantId: tenant.id,
      schoolId: tenant.schoolId,
      school: tenant.schoolName,
    },
    create: {
      firstName: 'Grace',
      lastName: 'Hopper',
      email: lecturerEmail,
      phoneNumber: '08011223344',
      role: Role.LECTURER,
      isVerified: true,
      approvalStatus: ApprovalStatus.VERIFIED,
      staffId: 'UOL-215-LEC-001',
      adminId: 'UOL-215-G-1001',
      departmentId: department.id,
      tenantId: tenant.id,
      schoolId: tenant.schoolId,
      school: tenant.schoolName,
      credential: { create: { passwordHash: hashedPassword } },
    },
  });

  // 4. Create the 4 Courses shown in the UI Screenshot
  const coursesData = [
    {
      courseCode: 'CSC 301',
      courseName: 'Data Structures & Algorithms',
      creditUnits: 3,
      level: 300,
      category: CourseCategory.CORE,
      description: 'Fundamental algorithms, binary search trees, hashing, dynamic programming and complexity analysis.',
    },
    {
      courseCode: 'CSC 401',
      courseName: 'Artificial Intelligence',
      creditUnits: 3,
      level: 400,
      category: CourseCategory.ELECTIVE,
      description: 'Search algorithms, knowledge representation, machine learning heuristics, and neural systems.',
    },
    {
      courseCode: 'CSC 201',
      courseName: 'Computer Programming I',
      creditUnits: 3,
      level: 200,
      category: CourseCategory.CORE,
      description: 'Introduction to programming principles, structured programming, control flows, and basic data structures.',
    },
    {
      courseCode: 'CSC 499',
      courseName: 'Final Year Project',
      creditUnits: 6,
      level: 400,
      category: CourseCategory.CORE,
      description: 'Independent supervised research and software engineering capstone project.',
    },
  ];

  const hodUser = await prisma.user.findFirst({ where: { tenantId, role: Role.HOD } }) || lecturer;

  const offerings = [];
  for (const c of coursesData) {
    const course = await prisma.course.upsert({
      where: { courseCode: c.courseCode },
      update: {
        courseName: c.courseName,
        creditUnits: c.creditUnits,
        level: c.level,
        category: c.category,
        description: c.description,
        departmentId: department.id,
        tenantId: tenant.id,
      },
      create: {
        courseCode: c.courseCode,
        courseName: c.courseName,
        creditUnits: c.creditUnits,
        level: c.level,
        category: c.category,
        description: c.description,
        departmentId: department.id,
        createdByHodId: hodUser.id,
        tenantId: tenant.id,
      },
    });

    let offering = await prisma.courseOffering.findFirst({
      where: {
        courseId: course.id,
        academicSession: session?.name || '2026/2027',
        semester: semesterName,
        tenantId: tenant.id,
      },
    });

    if (!offering) {
      offering = await prisma.courseOffering.create({
        data: {
          courseId: course.id,
          academicSession: session?.name || '2026/2027',
          semester: semesterName,
          tenantId: tenant.id,
        },
      });
    }

    // Assign lecturer
    await prisma.courseAssignment.upsert({
      where: {
        id: (await prisma.courseAssignment.findFirst({
          where: { courseOfferingId: offering.id, lecturerId: lecturer.id },
        }))?.id || '000000000000000000000000',
      },
      update: { status: 'APPROVED' },
      create: {
        courseOfferingId: offering.id,
        lecturerId: lecturer.id,
        status: 'APPROVED',
        role: 'LEAD_LECTURER',
        tenantId: tenant.id,
      },
    });

    offerings.push({ course, offering });
  }

  const csc301Offering = offerings[0].offering;
  const csc401Offering = offerings[1].offering;

  // 5. Set Schedules (matches UI screenshots)
  await setCourseSchedule(
    csc301Offering.id,
    { venue: 'PS Hall, Block 1', day: 'Monday', time: '1:30pm - 2:30pm' },
    lecturer.id,
    tenant.id
  );

  await setCourseSchedule(
    csc401Offering.id,
    { venue: 'Auditorium B', day: 'Tuesday', time: '2:00 PM' },
    lecturer.id,
    tenant.id
  );

  // 6. Set Syllabus for CSC 301
  await setCourseSyllabus(
    csc301Offering.id,
    {
      title: 'CSC 301 Full Course Syllabus',
      description: 'Comprehensive week-by-week curriculum covering Big-O, stacks, queues, trees, graphs, and sorting.',
      fileUrl: 'https://res.cloudinary.com/dpesanzkk/raw/upload/v17221789/documents/CSC301_Syllabus.pdf',
      fileName: 'CSC301_Syllabus.pdf',
    },
    lecturer.id,
    tenant.id
  );

  // 7. Add Course Materials for CSC 301 (PDFs & Images)
  await addCourseMaterials(
    csc301Offering.id,
    {
      materials: [
        {
          title: 'Module 1: Introduction to Asymptotic Notation',
          fileUrl: 'https://res.cloudinary.com/dpesanzkk/raw/upload/v17221790/materials/Module1_Asymptotic.pdf',
          fileType: 'PDF',
          fileSize: 2048500,
        },
        {
          title: 'Module 2: Binary Search Tree Visualization',
          fileUrl: 'https://res.cloudinary.com/dpesanzkk/image/upload/v17221791/materials/BST_Diagram.png',
          fileType: 'IMAGE',
          fileSize: 945000,
        },
      ],
    },
    lecturer.id,
    tenant.id
  );

  // 8. Create Enrolled Students & Submit Grades (matching UI Screenshot 4)
  const studentsMock = [
    { matricNo: '19/08/04/001', firstName: 'Adebayo', lastName: 'Ogundimu', email: 'adebayo.ogundimu@student.unilag.edu.ng', ca: 28, exam: 60, remarks: 'Excellent performance' },
    { matricNo: '19/08/04/002', firstName: 'Chioma', lastName: 'Okonkwo', email: 'chioma.okonkwo@student.unilag.edu.ng', ca: 25, exam: 55, remarks: 'Great analytical skills' },
    { matricNo: '19/08/04/003', firstName: 'Musa', lastName: 'Ibrahim', email: 'musa.ibrahim@student.unilag.edu.ng', ca: 18, exam: 45, remarks: 'Good attempt' },
    { matricNo: '19/08/04/004', firstName: 'Sarah', lastName: 'Doe', email: 'sarah.doe@student.unilag.edu.ng', ca: 15, exam: 35, remarks: 'Needs revision in trees' },
  ];

  for (const s of studentsMock) {
    const studentUser = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        staffId: s.matricNo,
        adminId: s.matricNo,
        isVerified: true,
        level: 300,
        tenantId: tenant.id,
      },
      create: {
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        staffId: s.matricNo,
        adminId: s.matricNo,
        role: Role.STUDENT,
        isVerified: true,
        approvalStatus: ApprovalStatus.VERIFIED,
        level: 300,
        tenantId: tenant.id,
        schoolId: tenant.schoolId,
        school: tenant.schoolName,
        departmentId: department.id,
      },
    });

    // Enroll student
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: { studentId: studentUser.id, courseOfferingId: csc301Offering.id },
    });

    if (!existingEnrollment) {
      await prisma.courseEnrollment.create({
        data: {
          studentId: studentUser.id,
          courseOfferingId: csc301Offering.id,
          status: 'ENROLLED',
          tenantId: tenant.id,
        },
      });
    }
  }

  // 9. Submit Grades for CSC 301
  const studentUsers = await prisma.user.findMany({
    where: { email: { in: studentsMock.map((s) => s.email) } },
  });

  const gradePayload = studentUsers.map((u) => {
    const mock = studentsMock.find((s) => s.email === u.email)!;
    return {
      studentId: u.id,
      caScore: mock.ca,
      examScore: mock.exam,
      remarks: mock.remarks,
    };
  });

  await submitGrades(csc301Offering.id, { grades: gradePayload }, lecturer.id, tenant.id);

  console.log('\n======================================================');
  console.log('✔ Lecturer Portal Data Seeded & Verified Successfully!');
  console.log('======================================================');

  // 10. Query and print Lecturer Dashboard View
  const lecturerCourses = await getLecturerCourses(lecturer.id, tenant.id);
  console.log('\n--- Lecturer "My Courses" List ---');
  console.log(JSON.stringify(lecturerCourses, null, 2));

  console.log('\n--- CSC 301 Student Roster & Gradebook ---');
  const roster = await getEnrolledStudents(csc301Offering.id, lecturer.id, 'LECTURER', tenant.id);
  console.log(JSON.stringify(roster, null, 2));

  // 11. Test Login
  const login = await loginUser({ email: lecturerEmail, password: lecturerPassword });
  console.log('\n✔ Lecturer Auth Token Validated:');
  console.log(login.token);
}

seedLecturerData()
  .catch((e) => {
    console.error('Error seeding lecturer data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
