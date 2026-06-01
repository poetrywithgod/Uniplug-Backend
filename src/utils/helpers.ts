export const generateAdminId = (firstName: string, schoolId: string): string => {
  // e.g. "UPH", "J", "4823" -> "UPH-J-4823"
  const prefix = schoolId.toUpperCase();
  const initial = firstName.charAt(0).toUpperCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();

  return `${prefix}-${initial}-${randomDigits}`;
};
