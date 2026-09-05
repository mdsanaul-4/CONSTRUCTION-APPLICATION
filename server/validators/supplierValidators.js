import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']).optional(),
});

export const supplierUpdateSchema = supplierSchema.partial();
