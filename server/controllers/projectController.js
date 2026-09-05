import Project from '../models/Project.js';
import Labourer from '../models/Labourer.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import { ok, created, fail } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/audit.js';

export const listProjects = asyncHandler(async (req, res) => {
  const { search = '', status, page = 1, limit = 20 } = req.query;
  const filter = { companyId: req.companyId };
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Project.countDocuments(filter),
  ]);

  return ok(res, { items, total, page: Number(page), limit: Number(limit) });
});

export const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({ ...req.body, companyId: req.companyId });
  await logActivity({ req, action: 'PROJECT_CREATED', entityType: 'Project', entityId: project._id, newData: project.toObject() });
  return created(res, { project }, 'Project created');
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!project) return fail(res, 'Project not found.', 404);
  return ok(res, { project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const before = await Project.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!before) return fail(res, 'Project not found.', 404);

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true }
  );

  await logActivity({
    req,
    action: 'PROJECT_UPDATED',
    entityType: 'Project',
    entityId: project._id,
    oldData: before.toObject(),
    newData: project.toObject(),
  });

  return ok(res, { project }, 'Project updated');
});

export const deactivateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    { status: req.body.status === 'active' ? 'active' : 'on_hold' },
    { new: true }
  );
  if (!project) return fail(res, 'Project not found.', 404);

  await logActivity({ req, action: 'PROJECT_UPDATED', entityType: 'Project', entityId: project._id, newData: { status: project.status } });
  return ok(res, { project }, 'Project status updated');
});

export const getProjectSummary = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!project) return fail(res, 'Project not found.', 404);

  const [labourerCount, attendanceAgg, payrollAgg] = await Promise.all([
    Labourer.countDocuments({ companyId: req.companyId, projectId: project._id, status: 'active' }),
    Attendance.aggregate([
      { $match: { companyId: project.companyId, projectId: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, overtimeHours: { $sum: '$overtimeHours' } } },
    ]),
    Payroll.aggregate([
      { $match: { companyId: project.companyId, projectId: project._id } },
      {
        $group: {
          _id: null,
          grossAmount: { $sum: '$grossAmount' },
          paidAmount: { $sum: '$paidAmount' },
          dueAmount: { $sum: '$dueAmount' },
        },
      },
    ]),
  ]);

  const payrollTotals = payrollAgg[0] || { grossAmount: 0, paidAmount: 0, dueAmount: 0 };

  return ok(res, {
    project,
    labourerCount,
    attendanceBreakdown: attendanceAgg,
    labourCost: payrollTotals.grossAmount,
    paid: payrollTotals.paidAmount,
    due: payrollTotals.dueAmount,
  });
});
