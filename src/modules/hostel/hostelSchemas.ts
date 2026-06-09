import { z } from 'zod';
import { HostelType, HostelApplicationStatus } from '../../../generated/prisma';

export const createHostelSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  type: z.nativeEnum(HostelType),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  price: z.number().positive('Price must be a positive number'),
  totalRooms: z
    .number()
    .int()
    .positive('Total rooms must be a positive integer'),
  totalBlocks: z
    .number()
    .int()
    .positive('Total blocks must be a positive integer'),
  totalWings: z
    .number()
    .int()
    .positive('Total wings must be a positive integer'),
  spacePerRoom: z
    .number()
    .int()
    .positive('Space per room must be a positive integer'),
});

export const updateHostelSchema = createHostelSchema.partial();

export const reviewApplicationSchema = z
  .object({
    status: z.enum([
      HostelApplicationStatus.APPROVED,
      HostelApplicationStatus.REJECTED,
    ]),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === HostelApplicationStatus.REJECTED) {
        return !!data.rejectionReason && data.rejectionReason.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when status is REJECTED',
      path: ['rejectionReason'],
    },
  );
