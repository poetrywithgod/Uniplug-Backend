import fs from 'fs/promises';
import path from 'path';

interface DepartmentsPayload {
  country: string;
  dataset: string;
  version: string;
  departments: string[];
}

const departmentsFilePath = path.join(
  process.cwd(),
  'data',
  'departments.json',
);

export const getDepartments = async (): Promise<DepartmentsPayload> => {
  const fileContent = await fs.readFile(departmentsFilePath, 'utf-8');
  return JSON.parse(fileContent) as DepartmentsPayload;
};
