import Settings from '../models/Settings.js';
import { ok } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';

export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ companyId: req.companyId });
  if (!settings) {
    settings = await Settings.create({ companyId: req.companyId });
  }
  return ok(res, { settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const before = await Settings.findOne({ companyId: req.companyId });

  const settings = await Settings.findOneAndUpdate(
    { companyId: req.companyId },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );

  await logActivity({
    req,
    action: 'SETTINGS_UPDATED',
    entityType: 'Settings',
    entityId: settings._id,
    oldData: before ? before.toObject() : null,
    newData: settings.toObject(),
  });

  return ok(res, { settings }, 'Settings updated');
});
