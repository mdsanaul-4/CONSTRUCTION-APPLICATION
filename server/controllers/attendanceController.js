import Attendance from '../models/Attendance.js';
import Labourer from '../models/Labourer.js';
import { ok, fail } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';
import { toBusinessDate } from '../utils/dateUtils.js';

// GET /api/attendance/sheet?date=&projectId=&supplierId=
// Loads active labourers plus any existing attendance for that date so the
// UI can render the fast "Present / Absent / Off" entry sheet.
export const getAttendanceSheet = asyncHandler(async (req, res) => {
  const { date, projectId, supplierId } = req.query;
  if (!date) return fail(res, 'Date is required.', 400);

  const businessDate = toBusinessDate(date);

  const labourerFilter = { companyId: req.companyId, status: 'active' };
  if (projectId) labourerFilter.projectId = projectId;
  if (supplierId) labourerFilter.supplierId = supplierId;

  const labourers = await Labourer.find(labourerFilter)
    .populate('supplierId', 'name')
    .populate('projectId', 'name')
    .sort({ name: 1 });

  const existing = await Attendance.find({
    companyId: req.companyId,
    date: businessDate,
    labourerId: { $in: labourers.map((l) => l._id) },
  });

  const existingMap = new Map(existing.map((e) => [e.labourerId.toString(), e]));

  const sheet = labourers.map((l) => {
    const rec = existingMap.get(l._id.toString());
    return {
      labourerId: l._id,
      name: l.name,
      supplier: l.supplierId ? l.supplierId.name : null,
      project: l.projectId ? l.projectId.name : null,
      dailyRate: l.dailyRate,
      overtimeRate: l.overtimeRate,
      status: rec ? rec.status : null,
      overtimeHours: rec ? rec.overtimeHours : 0,
      notes: rec ? rec.notes : '',
      alreadyMarked: Boolean(rec),
    };
  });

  return ok(res, { date: businessDate, sheet, hasExistingEntries: existing.length > 0 });
});

// POST /api/attendance/bulk
// Saves/updates attendance for many labourers on one date in a single call.
export const saveBulkAttendance = asyncHandler(async (req, res) => {
  const { date, projectId, entries, overwrite } = req.body;
  const businessDate = toBusinessDate(date);

  const labourerIds = entries.map((e) => e.labourerId);
  const existing = await Attendance.find({
    companyId: req.companyId,
    date: businessDate,
    labourerId: { $in: labourerIds },
  });

  if (existing.length > 0 && !overwrite) {
    return fail(
      res,
      'Attendance already exists for one or more labourers on this date. Resubmit with overwrite=true to edit it.',
      409,
      existing.map((e) => e.labourerId.toString())
    );
  }

  const existingMap = new Map(existing.map((e) => [e.labourerId.toString(), e]));
  const results = [];

  for (const entry of entries) {
    const key = entry.labourerId.toString();
    const prev = existingMap.get(key);

    if (prev) {
      const before = prev.toObject();
      prev.status = entry.status;
      prev.overtimeHours = entry.overtimeHours;
      prev.notes = entry.notes;
      prev.projectId = projectId || prev.projectId;
      await prev.save();
      await logActivity({
        req,
        action: 'ATTENDANCE_UPDATED',
        entityType: 'Attendance',
        entityId: prev._id,
        oldData: before,
        newData: prev.toObject(),
      });
      results.push(prev);
    } else {
      const created = await Attendance.create({
        companyId: req.companyId,
        labourerId: entry.labourerId,
        projectId: projectId || null,
        date: businessDate,
        status: entry.status,
        overtimeHours: entry.overtimeHours,
        notes: entry.notes,
        createdBy: req.user._id,
      });
      await logActivity({
        req,
        action: 'ATTENDANCE_CREATED',
        entityType: 'Attendance',
        entityId: created._id,
        newData: created.toObject(),
      });
      results.push(created);
    }
  }

  return ok(res, { count: results.length, records: results }, 'Attendance saved');
});

export const listAttendance = asyncHandler(async (req, res) => {
  const { date, startDate, endDate, projectId, supplierId, labourerId, status, page = 1, limit = 50 } = req.query;
  const filter = { companyId: req.companyId };

  if (date) filter.date = toBusinessDate(date);
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = toBusinessDate(startDate);
    if (endDate) filter.date.$lte = toBusinessDate(endDate);
  }
  if (projectId) filter.projectId = projectId;
  if (labourerId) filter.labourerId = labourerId;
  if (status) filter.status = status;

  let labourerIds = null;
  if (supplierId) {
    labourerIds = await (await import('../models/Labourer.js')).default.find({ companyId: req.companyId, supplierId }).distinct('_id');
    filter.labourerId = { $in: labourerIds };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .populate('labourerId', 'name')
      .populate('projectId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(filter),
  ]);

  return ok(res, { items, total, page: Number(page), limit: Number(limit) });
});

export const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const before = await Attendance.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!before) return fail(res, 'Attendance record not found.', 404);

  const { status, overtimeHours, notes } = req.body;
  before.status = status ?? before.status;
  before.overtimeHours = overtimeHours ?? before.overtimeHours;
  before.notes = notes ?? before.notes;

  const beforeObj = before.toObject();
  await before.save();

  await logActivity({
    req,
    action: 'ATTENDANCE_UPDATED',
    entityType: 'Attendance',
    entityId: before._id,
    oldData: beforeObj,
    newData: before.toObject(),
  });

  return ok(res, { attendance: before }, 'Attendance updated');
});
