import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
import { fail } from '../utils/apiResponse.js';

export const ROLE_DEFAULT_PERMISSIONS = {
  owner: ['*'],
  manager: [
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
    'reports.view',
  ],
  accountant: [
    'dashboard.view',
    'payroll.view',
    'payroll.manage',
    'payments.view',
    'payments.manage',
    'reports.view',
  ],
  supervisor: [
    'dashboard.view',
    'labourers.view',
    'attendance.view',
    'attendance.create',
  ],
};

export function userHasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'owner') return true;

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.includes('*') ||
    permissions.includes(permission) ||
    (permissions.length === 0 && (ROLE_DEFAULT_PERMISSIONS[user.role] || []).includes(permission));
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return fail(res, 'Not authenticated. Please log in.', 401);

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return fail(res, 'Account not found or deactivated.', 401);
    }

    req.user = user;
    req.companyId = user.companyId;
    next();
  } catch (err) {
    return fail(res, 'Invalid or expired session. Please log in again.', 401);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, 'You do not have permission to perform this action.', 403);
    }
    next();
  };
}

export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user || !permissions.some((permission) => userHasPermission(req.user, permission))) {
      return fail(res, 'You do not have permission to perform this action.', 403);
    }
    next();
  };
}


export function requireAttendanceWrite(req, res, next) {
  const permission = req.body?.overwrite ? 'attendance.update' : 'attendance.create';
  return requirePermission(permission)(req, res, next);
}
