import AuditLog from '../models/AuditLog.js';
import { ok } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listActivity = asyncHandler(async (req, res) => {
  const { entityType, action, page = 1, limit = 50 } = req.query;
  const filter = { companyId: req.companyId };
  if (entityType) filter.entityType = entityType;
  if (action) filter.action = action;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    AuditLog.find(filter).populate('userId', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);

  return ok(res, { items, total, page: Number(page), limit: Number(limit) });
});
