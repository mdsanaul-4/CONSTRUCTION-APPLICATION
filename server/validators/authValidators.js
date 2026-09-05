
import { z } from 'zod';


export const userPermissions = [
  'dashboard.view',
  'projects.view',
  'suppliers.view',
  'labourers.view',
  'labourers.create',
  'labourers.update',
  'labourers.delete',
  'attendance.view',
  'attendance.create',
  'attendance.update',
  'payroll.view',
  'payroll.manage',
  'payments.view',
  'payments.manage',
  'reports.view',
  'activity.view',
];

// Login
export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Change password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters'),
});

// Create user
// Only the owner can create accounts.
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['manager', 'accountant', 'supervisor']),
  permissions: z.array(z.enum(userPermissions)).optional(),
});

// Update user
export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['manager', 'accountant', 'supervisor']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
  permissions: z.array(z.enum(userPermissions)).optional(),
});




export const resetUserPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
