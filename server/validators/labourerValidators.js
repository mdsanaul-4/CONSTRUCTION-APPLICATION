import { z } from 'zod';

const objectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const labourerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  supplierId: objectIdLike.optional().nullable(),
  projectId: objectIdLike.optional().nullable(),
  photo: z.string().optional().default(''),
  dailyRate: z.coerce.number().min(0, 'Daily rate must be positive'),
  overtimeRate: z.coerce.number().min(0, 'Overtime rate must be positive').default(0),
  joiningDate: z.coerce.date().optional(),
  leavingDate: z.coerce.date().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
  notes: z.string().optional().default(''),
});

export const labourerUpdateSchema = labourerSchema.partial();
