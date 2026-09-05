import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  clientName: z.string().optional().default(''),
  location: z.string().optional().default(''),
  description: z.string().optional().default(''),
  startDate: z.coerce.date().optional(),
  expectedEndDate: z.coerce.date().optional(),
  status: z.enum(['active', 'completed', 'on_hold']).optional(),
});

export const projectUpdateSchema = projectSchema.partial();
