import { Router } from 'express';
import User from '../models/User.js';
import { ok, created, fail } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema, resetUserPasswordSchema } from '../validators/authValidators.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('owner'));

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ companyId: req.companyId }).sort({ createdAt: -1 });
  return ok(res, { items: users });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, permissions = [] } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return fail(res, 'A user with this email already exists.', 409);

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role,
    permissions,
    companyId: req.companyId,
  });

  await logActivity({
    req,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: user._id,
    newData: { name: user.name, email: user.email, role: user.role, permissions: user.permissions },
  });

  return created(res, { user }, 'User created');
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!user) return fail(res, 'User not found.', 404);
  if (user.role === 'owner') return fail(res, 'The owner account cannot be edited here.', 403);

  const before = {
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    permissions: user.permissions,
  };

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
  if (req.body.permissions !== undefined) user.permissions = req.body.permissions;

  await user.save();

  await logActivity({
    req,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: user._id,
    oldData: before,
    newData: { name: user.name, role: user.role, isActive: user.isActive, permissions: user.permissions },
  });

  return ok(res, { user }, 'User updated');
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, companyId: req.companyId }).select('+passwordHash');
  if (!user) return fail(res, 'User not found.', 404);
  if (user.role === 'owner') return fail(res, 'The owner password cannot be reset here.', 403);

  user.passwordHash = await User.hashPassword(req.body.newPassword);
  await user.save();

  await logActivity({
    req,
    action: 'USER_PASSWORD_RESET_BY_OWNER',
    entityType: 'User',
    entityId: user._id,
    newData: { email: user.email },
  });

  return ok(res, {}, 'Password reset successfully');
});

router.get('/', listUsers);
router.post('/', validateBody(createUserSchema), createUser);
router.patch('/:id', validateBody(updateUserSchema), updateUser);
router.patch('/:id/password', validateBody(resetUserPasswordSchema), resetUserPassword);

export default router;
