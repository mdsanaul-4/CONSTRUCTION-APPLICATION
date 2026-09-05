import Payroll from '../models/Payroll.js';
import Labourer from '../models/Labourer.js';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';
import Settings from '../models/Settings.js';
import { ok, created, fail } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';
import { monthRange } from '../utils/dateUtils.js';
import { summarizeAttendance, calculatePayroll, round2 } from '../services/payrollEngine.js';

async function getActiveSettings(companyId) {
  let settings = await Settings.findOne({ companyId });
  if (!settings) settings = await Settings.create({ companyId });
  return settings;
}

async function computeLabourerPayroll({ companyId, labourer, month, year, settings }) {
  const { start, end } = monthRange(month, year);
  const attendance = await Attendance.find({
    companyId,
    labourerId: labourer._id,
    date: { $gte: start, $lt: end },
  });

  const summary = summarizeAttendance(attendance);
  const { basicAmount, overtimeAmount, grossAmount } = calculatePayroll({
    summary,
    dailyRate: labourer.dailyRate,
    overtimeRate: labourer.overtimeRate,
    otherEarnings: 0,
    deductions: 0,
    weeklyOffPaid: settings.weeklyOffPaid,
    holidayPaid: settings.holidayPaid,
  });

  return { summary, basicAmount, overtimeAmount, grossAmount };
}

// POST /api/payroll/generate
export const generatePayroll = asyncHandler(async (req, res) => {
  const { month, year, projectId, supplierId, labourerIds } = req.body;
  const settings = await getActiveSettings(req.companyId);

  const filter = { companyId: req.companyId, status: 'active' };
  if (projectId) filter.projectId = projectId;
  if (supplierId) filter.supplierId = supplierId;
  if (labourerIds && labourerIds.length) filter._id = { $in: labourerIds };

  const labourers = await Labourer.find(filter);
  if (labourers.length === 0) {
    return fail(res, 'No active labourers matched the selected filters.', 400);
  }

  const results = [];

  for (const labourer of labourers) {
    const existing = await Payroll.findOne({ companyId: req.companyId, labourerId: labourer._id, month, year });
    if (existing && existing.status !== 'draft') {
      // Do not silently overwrite finalized/paid payroll.
      results.push(existing);
      continue;
    }

    const { summary, basicAmount, overtimeAmount, grossAmount } = await computeLabourerPayroll({
      companyId: req.companyId,
      labourer,
      month,
      year,
      settings,
    });

    const payload = {
      companyId: req.companyId,
      labourerId: labourer._id,
      month,
      year,
      projectId: labourer.projectId || null,
      supplierId: labourer.supplierId || null,
      ...summary,
      dailyRateAtPayroll: labourer.dailyRate,
      overtimeRateAtPayroll: labourer.overtimeRate,
      basicAmount,
      overtimeAmount,
      otherEarnings: existing ? existing.otherEarnings : 0,
      deductions: existing ? existing.deductions : 0,
      grossAmount,
      paidAmount: existing ? existing.paidAmount : 0,
      dueAmount: existing ? round2(grossAmount - existing.paidAmount) : grossAmount,
      weeklyOffPaidApplied: settings.weeklyOffPaid,
      holidayPaidApplied: settings.holidayPaid,
      status: 'draft',
    };

    let record;
    if (existing) {
      Object.assign(existing, payload);
      record = await existing.save();
    } else {
      record = await Payroll.create(payload);
    }

    await logActivity({ req, action: 'PAYROLL_GENERATED', entityType: 'Payroll', entityId: record._id, newData: record.toObject() });
    results.push(record);
  }

  return ok(res, { count: results.length, payrolls: results }, 'Payroll generated');
});

export const listPayroll = asyncHandler(async (req, res) => {
  const { month, year, projectId, supplierId, status, page = 1, limit = 50 } = req.query;
  const filter = { companyId: req.companyId };
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (projectId) filter.projectId = projectId;
  if (supplierId) filter.supplierId = supplierId;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Payroll.find(filter)
      .populate('labourerId', 'name')
      .populate('projectId', 'name')
      .populate('supplierId', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payroll.countDocuments(filter),
  ]);

  return ok(res, { items, total, page: Number(page), limit: Number(limit) });
});

export const getPayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('labourerId', 'name dailyRate overtimeRate')
    .populate('projectId', 'name')
    .populate('supplierId', 'name');
  if (!payroll) return fail(res, 'Payroll record not found.', 404);
  return ok(res, { payroll });
});

// Recalculate a draft payroll record's other earnings / deductions, and
// re-run the money math on the backend (never trust client-supplied totals).
export const updatePayrollDraft = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!payroll) return fail(res, 'Payroll record not found.', 404);
  if (payroll.status !== 'draft') {
    return fail(res, 'Only draft payroll can be edited. Reopen it first.', 400);
  }

  const before = payroll.toObject();
  if (req.body.otherEarnings !== undefined) payroll.otherEarnings = req.body.otherEarnings;
  if (req.body.deductions !== undefined) payroll.deductions = req.body.deductions;

  payroll.grossAmount = round2(payroll.basicAmount + payroll.overtimeAmount + payroll.otherEarnings - payroll.deductions);
  payroll.dueAmount = round2(Math.max(payroll.grossAmount - payroll.paidAmount, 0));

  await payroll.save();

  await logActivity({
    req,
    action: 'PAYROLL_GENERATED',
    entityType: 'Payroll',
    entityId: payroll._id,
    oldData: before,
    newData: payroll.toObject(),
  });

  return ok(res, { payroll }, 'Payroll draft updated');
});

export const finalizePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!payroll) return fail(res, 'Payroll record not found.', 404);
  if (payroll.status !== 'draft') {
    return fail(res, 'Only draft payroll can be finalized.', 400);
  }

  const before = payroll.toObject();
  payroll.status = payroll.paidAmount > 0 ? (payroll.dueAmount <= 0 ? 'paid' : 'partially_paid') : 'finalized';
  payroll.finalizedAt = new Date();
  payroll.finalizedBy = req.user._id;
  await payroll.save();

  await logActivity({
    req,
    action: 'PAYROLL_FINALIZED',
    entityType: 'Payroll',
    entityId: payroll._id,
    oldData: before,
    newData: payroll.toObject(),
  });

  return ok(res, { payroll }, 'Payroll finalized');
});

// Authorized reopen of a finalized payroll (e.g. to correct a mistake).
export const reopenPayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!payroll) return fail(res, 'Payroll record not found.', 404);
  if (payroll.status === 'draft') return fail(res, 'Payroll is already in draft.', 400);

  const before = payroll.toObject();
  payroll.status = 'draft';
  payroll.finalizedAt = null;
  payroll.finalizedBy = null;
  await payroll.save();

  await logActivity({
    req,
    action: 'PAYROLL_FINALIZED',
    entityType: 'Payroll',
    entityId: payroll._id,
    oldData: before,
    newData: payroll.toObject(),
  });

  return ok(res, { payroll }, 'Payroll reopened for editing');
});
