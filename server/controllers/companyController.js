import Company from '../models/Company.js';
import { ok, fail } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';

export const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  if (!company) return fail(res, 'Company not found.', 404);
  return ok(res, { company });
});

export const updateCompany = asyncHandler(async (req, res) => {
  const before = await Company.findById(req.companyId);
  if (!before) return fail(res, 'Company not found.', 404);

  const allowed = ['name', 'phone', 'email', 'address', 'logo'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const company = await Company.findByIdAndUpdate(req.companyId, updates, { new: true, runValidators: true });

  await logActivity({
    req,
    action: 'SETTINGS_UPDATED',
    entityType: 'Company',
    entityId: company._id,
    oldData: before.toObject(),
    newData: company.toObject(),
  });

  return ok(res, { company }, 'Company updated');
});
