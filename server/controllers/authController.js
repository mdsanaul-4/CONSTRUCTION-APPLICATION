import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { ok, fail } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    return fail(res, 'Invalid email or password.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return fail(res, 'Invalid email or password.', 401);
  }

  const token = signToken(user);
  return ok(res, { token, user }, 'Login successful');
});

export const getMe = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user }, 'Current user');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+passwordHash');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return fail(res, 'Current password is incorrect.', 400);
  }

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  await logActivity({ req, action: 'USER_PASSWORD_CHANGED', entityType: 'User', entityId: user._id });

  return ok(res, {}, 'Password updated successfully');
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT — logout is handled client-side by discarding the token.
  return ok(res, {}, 'Logged out');
});
