import { z } from 'zod';

export const getUploadSignatureQuerySchema = z.object({
  folder: z.string().min(1, 'Folder name cannot be empty').optional().default('general'),
});
