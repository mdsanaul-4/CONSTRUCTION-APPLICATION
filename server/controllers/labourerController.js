import mongoose from 'mongoose';
import Labourer from '../models/Labourer.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Payment from '../models/Payment.js';
import AuditLog from '../models/AuditLog.js';
import { ok, created, fail } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';

export const listLabourers = asyncHandler(async (req, res) => {
  const { search = '', status, supplierId, projectId, page = 1, limit = 20 } = req.query;
  const filter = { companyId: req.companyId };
  if (status) filter.status = status;
  if (supplierId) filter.supplierId = supplierId;
  if (projectId) filter.projectId = projectId;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Labourer.find(filter)
      .populate('supplierId', 'name')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Labourer.countDocuments(filter),
  ]);

  return ok(res, { items, total, page: Number(page), limit: Number(limit) });
});

export const createLabourer = asyncHandler(async (req, res) => {
  const labourer = await Labourer.create({ ...req.body, companyId: req.companyId });
  await logActivity({ req, action: 'LABOURER_CREATED', entityType: 'Labourer', entityId: labourer._id, newData: labourer.toObject() });
  return created(res, { labourer }, 'Labourer created');
});

export const getLabourer = asyncHandler(async (req, res) => {
  const labourer = await Labourer.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('supplierId', 'name')
    .populate('projectId', 'name');
  if (!labourer) return fail(res, 'Labourer not found.', 404);
  return ok(res, { labourer });
});

export const updateLabourer = asyncHandler(async (req, res) => {
  const before = await Labourer.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!before) return fail(res, 'Labourer not found.', 404);

  const labourer = await Labourer.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true }
  );

  await logActivity({
    req,
    action: 'LABOURER_UPDATED',
    entityType: 'Labourer',
    entityId: labourer._id,
    oldData: before.toObject(),
    newData: labourer.toObject(),
  });

  return ok(res, { labourer }, 'Labourer updated');
});

// Labourers with history are never hard-deleted — only deactivated.
export const deactivateLabourer = asyncHandler(async (req, res) => {
  const labourer = await Labourer.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    { status: req.body.status === 'active' ? 'active' : 'inactive', leavingDate: req.body.status === 'inactive' ? new Date() : undefined },
    { new: true }
  );
  if (!labourer) return fail(res, 'Labourer not found.', 404);

  await logActivity({
    req,
    action: 'LABOURER_DEACTIVATED',
    entityType: 'Labourer',
    entityId: labourer._id,
    newData: { status: labourer.status },
  });

  return ok(res, { labourer }, 'Labourer status updated');
});

export const getLabourerProfile = asyncHandler(async (req, res) => {
  const labourer = await Labourer.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('supplierId', 'name')
    .populate('projectId', 'name');
  if (!labourer) return fail(res, 'Labourer not found.', 404);

  const { startDate, endDate } = req.query;
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const attendanceFilter = { companyId: req.companyId, labourerId: labourer._id };
  if (startDate || endDate) attendanceFilter.date = dateFilter;

  const [attendanceAgg, payrolls, payments, activity] = await Promise.all([
    Attendance.aggregate([
      { $match: attendanceFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, overtimeHours: { $sum: '$overtimeHours' } } },
    ]),
    Payroll.find({ companyId: req.companyId, labourerId: labourer._id }).sort({ year: -1, month: -1 }),
    Payment.find({ companyId: req.companyId, labourerId: labourer._id }).sort({ paymentDate: -1 }),
    AuditLog.find({ companyId: req.companyId, entityType: 'Labourer', entityId: labourer._id }).sort({ createdAt: -1 }).limit(50),
  ]);

  const totals = attendanceAgg.reduce(
    (acc, row) => {
      acc.overtimeHours += row.overtimeHours || 0;
      if (row._id === 'present') acc.presentDays = row.count;
      if (row._id === 'absent') acc.absentDays = row.count;
      if (row._id === 'off') acc.offDays = row.count;
      if (row._id === 'half_day') acc.halfDays = row.count;
      if (row._id === 'holiday') acc.holidayDays = row.count;
      return acc;
    },
    { presentDays: 0, absentDays: 0, offDays: 0, halfDays: 0, holidayDays: 0, overtimeHours: 0 }
  );

  const totalSalary = payrolls.reduce((s, p) => s + p.grossAmount, 0);
  const totalPaid = payments.filter((p) => p.status === 'active').reduce((s, p) => s + p.amount, 0);

  return ok(res, {
    labourer,
    totals,
    totalSalary,
    totalPaid,
    totalDue: Math.max(totalSalary - totalPaid, 0),
    payrolls,
    payments,
    activity,
  });
});
