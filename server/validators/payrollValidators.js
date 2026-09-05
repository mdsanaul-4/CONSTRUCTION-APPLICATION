import { z } from 'zod';

const objectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const generatePayrollSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  projectId: objectIdLike.optional().nullable(),
  supplierId: objectIdLike.optional().nullable(),
  labourerIds: z.array(objectIdLike).optional(),
});

export const updatePayrollSchema = z.object({
  otherEarnings: z.coerce.number().optional(),
  deductions: z.coerce.number().optional(),
});

export const paymentSchema = z.object({
  labourerId: objectIdLike,
  payrollId: objectIdLike.optional().nullable(),
  projectId: objectIdLike.optional().nullable(),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  paymentDate: z.coerce.date().optional(),
  method: z.enum(['cash', 'bank', 'upi', 'other']).optional(),
  referenceNumber: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const voidPaymentSchema = z.object({
  reason: z.string().min(1, 'A reason is required to void a payment'),
});
