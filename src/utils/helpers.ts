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
