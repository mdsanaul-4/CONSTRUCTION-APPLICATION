import Payment from '../models/Payment.js';
import Payroll from '../models/Payroll.js';
import Labourer from '../models/Labourer.js';
import { ok, created, fail } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';
import { round2 } from '../services/payrollEngine.js';

// Recompute a payroll record's paidAmount/dueAmount/status from its active payments.
// This keeps payroll and payments as two separate but always-consistent sources of truth.
async function recalculatePayrollTotals(companyId, payrollId) {
  if (!payrollId) return;
  const payroll = await Payroll.findOne({ _id: payrollId, companyId });
  if (!payroll) return;

  const payments = await Payment.find({ companyId, payrollId, status: 'active' });
  const paidAmount = round2(payments.reduce((sum, p) => sum + p.amount, 0));
  const dueAmount = round2(Math.max(payroll.grossAmount - paidAmount, 0));

  payroll.paidAmount = paidAmount;
  payroll.dueAmount = dueAmount;

  if (payroll.status !== 'draft') {
    payroll.status = paidAmount <= 0 ? 'finalized' : dueAmount <= 0 ? 'paid' : 'partially_paid';
  }

  await payroll.save();
}

export const listPayments = asyncHandler(async (req, res) => {
  const { startDate, endDate, labourerId, projectId, method, status, page = 1, limit = 50 } = req.query;
  const filter = { companyId: req.companyId };
  if (labourerId) filter.labourerId = labourerId;
  if (projectId) filter.projectId = projectId;
  if (method) filter.method = method;
  filter.status = status || 'active';

  if (startDate || endDate) {
    filter.paymentDate = {};
    if (startDate) filter.paymentDate.$gte = new Date(startDate);
    if (endDate) filter.paymentDate.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('labourerId', 'name')
      .populate('projectId', 'name')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  return ok(res, { items, total, page: Number(page), limit: Number(limit) });
});

export const createPayment = asyncHandler(async (req, res) => {
  const labourer = await Labourer.findOne({ _id: req.body.labourerId, companyId: req.companyId });
  if (!labourer) return fail(res, 'Labourer not found.', 404);

  const payment = await Payment.create({
    ...req.body,
    companyId: req.companyId,
    projectId: req.body.projectId || labourer.projectId,
    createdBy: req.user._id,
  });

  await recalculatePayrollTotals(req.companyId, payment.payrollId);

  await logActivity({ req, action: 'PAYMENT_CREATED', entityType: 'Payment', entityId: payment._id, newData: payment.toObject() });

  return created(res, { payment }, 'Payment recorded');
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('labourerId', 'name')
    .populate('projectId', 'name')
    .populate('payrollId');
  if (!payment) return fail(res, 'Payment not found.', 404);
  return ok(res, { payment });
});

// Payments are never hard-deleted — voiding preserves the historical record
// while excluding it from payroll paid/due totals.
export const voidPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!payment) return fail(res, 'Payment not found.', 404);
  if (payment.status === 'voided') return fail(res, 'Payment is already voided.', 400);

  const before = payment.toObject();
  payment.status = 'voided';
  payment.voidedAt = new Date();
  payment.voidedBy = req.user._id;
  payment.voidReason = req.body.reason;
  await payment.save();

  await recalculatePayrollTotals(req.companyId, payment.payrollId);

  await logActivity({
    req,
    action: 'PAYMENT_VOIDED',
    entityType: 'Payment',
    entityId: payment._id,
    oldData: before,
    newData: payment.toObject(),
  });

  return ok(res, { payment }, 'Payment voided');
});
