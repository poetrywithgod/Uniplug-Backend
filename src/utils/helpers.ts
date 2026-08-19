import prisma from '../configs/prismaConfig';

/**
 * Checks if the active semester for a given tenant is the Second Semester.
 * Applications and admissions are prohibited during the Second Semester.
 */
export const checkSecondSemesterRestriction = async (tenantId: string): Promise<boolean> => {
  if (!tenantId) return false;

  const activeSession = await prisma.academicSession.findFirst({
    where: { tenantId, isActive: true },
  });

  if (activeSession) {
    const activeSemester = await prisma.academicSemester.findFirst({
      where: { sessionId: activeSession.id, isActive: true },
    });

    if (activeSemester?.name === 'SECOND_SEMESTER') {
      return true;
    }
  }

  const directActiveSemester = await prisma.academicSemester.findFirst({
    where: { tenantId, isActive: true },
  });

  return directActiveSemester?.name === 'SECOND_SEMESTER';
};

export const generateAdminId = (firstName: string, schoolId: string): string => {
  // e.g. "UPH", "J", "4823" -> "UPH-J-4823"
  const prefix = schoolId.toUpperCase();
  const initial = firstName.charAt(0).toUpperCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();

  return `${prefix}-${initial}-${randomDigits}`;
};

export const generateStaffId = (role: string, schoolId: string): string => {
  let rolePrefix = 'STF';
  if (role === 'LECTURER') rolePrefix = 'LEC';
  else if (role === 'HOD') rolePrefix = 'HOD';
  else if (role === 'HOSTEL_MANAGER') rolePrefix = 'HST';
  else if (role === 'ADMISSION_OFFICER') rolePrefix = 'ADM';
  else if (role === 'EXAMINATION_OFFICER') rolePrefix = 'EXM';
  else if (role === 'FINANCE_OFFICER') rolePrefix = 'FIN';
  else if (role === 'HOSTEL_STAFF') rolePrefix = 'HSS';

  const prefix = schoolId.toUpperCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();

  return `${prefix}-${rolePrefix}-${randomDigits}`;
};

export const generateMatricNumber = (
  schoolId: string,
  schoolName: string,
  courseOrDeptName: string,
  sequence: number,
  sessionYear?: string
): string => {
  // 1. School Code: Extract prefix from schoolId (e.g. "UOL-215" -> "UOL") or schoolName acronym
  let schoolCode = schoolId.split('-')[0].toUpperCase();
  if (!schoolCode || schoolCode.length < 2) {
    const words = schoolName.trim().split(/\s+/);
    schoolCode =
      words.length >= 2
        ? words.map((w) => w[0]).join('').toUpperCase()
        : schoolName.substring(0, 3).toUpperCase();
  }

  // 2. Department / Course Code: Derive 3-letter acronym
  let deptCode = 'GEN';
  if (courseOrDeptName) {
    const cleanName = courseOrDeptName.replace(/department of|faculty of/gi, '').trim();
    const words = cleanName.split(/\s+/).filter((w) => w.length >= 2);
    if (words.length >= 3) {
      deptCode = words
        .slice(0, 3)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
    } else if (words.length === 2) {
      deptCode = (words[0].substring(0, 2) + words[1][0]).toUpperCase();
    } else if (words.length === 1) {
      deptCode = words[0].substring(0, 3).toUpperCase();
    }
  }

  // 3. Year Code (e.g. "2027/2028" -> "2027" or current year)
  let yearCode = new Date().getFullYear().toString();
  if (sessionYear) {
    const match = sessionYear.match(/\d{4}/);
    if (match) yearCode = match[0];
  }

  // 4. Sequence padded to 4 digits (e.g. 0001)
  const paddedSeq = sequence.toString().padStart(4, '0');

  return `${schoolCode}/${deptCode}/${yearCode}/${paddedSeq}`;
};

