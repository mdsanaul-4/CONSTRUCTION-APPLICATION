import { z } from 'zod';

const objectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const attendanceEntrySchema = z.object({
  labourerId: objectIdLike,
  status: z.enum(['present', 'absent', 'half_day', 'off', 'holiday']),
  overtimeHours: z.coerce.number().min(0).default(0),
  notes: z.string().optional().default(''),
});

export const bulkAttendanceSchema = z.object({
  date: z.coerce.date(),
  projectId: objectIdLike.optional().nullable(),
  entries: z.array(attendanceEntrySchema).min(1, 'At least one attendance entry is required'),
  overwrite: z.boolean().optional().default(false),
});

export const attendanceQuerySchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  projectId: z.string().optional(),
  supplierId: z.string().optional(),
  labourerId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
});
