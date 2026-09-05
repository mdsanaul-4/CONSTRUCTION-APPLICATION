import Supplier from '../models/Supplier.js';
import Labourer from '../models/Labourer.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Payment from '../models/Payment.js';
import { ok, created, fail } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';

export const listSuppliers = asyncHandler(async (req, res) => {
  const { search = '', status, page = 1, limit = 20 } = req.query;
  const filter = { companyId: req.companyId };
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Supplier.countDocuments(filter),
  ]);

  return ok(res, { items, total, page: Number(page), limit: Number(limit) });
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create({ ...req.body, companyId: req.companyId });
  await logActivity({ req, action: 'SUPPLIER_CREATED', entityType: 'Supplier', entityId: supplier._id, newData: supplier.toObject() });
  return created(res, { supplier }, 'Supplier created');
});

export const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!supplier) return fail(res, 'Supplier not found.', 404);
  return ok(res, { supplier });
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const before = await Supplier.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!before) return fail(res, 'Supplier not found.', 404);

  const supplier = await Supplier.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true }
  );

  await logActivity({
    req,
    action: 'SUPPLIER_UPDATED',
    entityType: 'Supplier',
    entityId: supplier._id,
    oldData: before.toObject(),
    newData: supplier.toObject(),
  });

  return ok(res, { supplier }, 'Supplier updated');
});

export const getSupplierSummary = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!supplier) return fail(res, 'Supplier not found.', 404);

  const [labourers, attendanceAgg, payrollAgg, payments] = await Promise.all([
    Labourer.find({ companyId: req.companyId, supplierId: supplier._id }),
    Attendance.aggregate([
      { $match: { companyId: supplier.companyId, labourerId: { $in: await Labourer.find({ supplierId: supplier._id }).distinct('_id') } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Payroll.aggregate([
      { $match: { companyId: supplier.companyId, supplierId: supplier._id } },
      { $group: { _id: null, grossAmount: { $sum: '$grossAmount' }, paidAmount: { $sum: '$paidAmount' }, dueAmount: { $sum: '$dueAmount' } } },
    ]),
    Payment.find({ companyId: req.companyId, labourerId: { $in: await Labourer.find({ supplierId: supplier._id }).distinct('_id') }, status: 'active' })
      .sort({ paymentDate: -1 })
      .limit(20),
  ]);

  const payrollTotals = payrollAgg[0] || { grossAmount: 0, paidAmount: 0, dueAmount: 0 };

  return ok(res, {
    supplier,
    labourers,
    attendanceBreakdown: attendanceAgg,
    totalSalary: payrollTotals.grossAmount,
    paid: payrollTotals.paidAmount,
    due: payrollTotals.dueAmount,
    recentPayments: payments,
  });
});
