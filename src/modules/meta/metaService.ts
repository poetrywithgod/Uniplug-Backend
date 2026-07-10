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

/**
 * Fetch the configured academic departments dataset from the local JSON storage file.
 * Used for populating dropdown lists and department selections across the app.
 */
export const getDepartments = async (): Promise<DepartmentsPayload> => {
  const fileContent = await fs.readFile(departmentsFilePath, 'utf-8');
  return JSON.parse(fileContent) as DepartmentsPayload;
};
