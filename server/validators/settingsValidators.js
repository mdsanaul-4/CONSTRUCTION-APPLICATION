import { z } from 'zod';

export const settingsSchema = z.object({
  weeklyOffPaid: z.boolean().optional(),
  holidayPaid: z.boolean().optional(),
  defaultOvertimeRate: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  companyName: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().optional(),
  companyAddress: z.string().optional(),
});
