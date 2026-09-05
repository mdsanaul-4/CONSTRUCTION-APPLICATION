import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Payment from '../models/Payment.js';
import Labourer from '../models/Labourer.js';
import Supplier from '../models/Supplier.js';
import Project from '../models/Project.js';
import { ok } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { round2 } from '../services/payrollEngine.js';

function buildDateFilter(query, field = 'date') {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter[field] = {};
    if (query.startDate) filter[field].$gte = new Date(query.startDate);
    if (query.endDate) filter[field].$lte = new Date(query.endDate);
  }
  return filter;
}

export const attendanceReport = asyncHandler(async (req, res) => {
  const { projectId, supplierId, labourerId, status } = req.query;
  const filter = { companyId: req.companyId, ...buildDateFilter(req.query) };
  if (projectId) filter.projectId = projectId;
  if (labourerId) filter.labourerId = labourerId;
  if (status) filter.status = status;

  if (supplierId) {
    filter.labourerId = { $in: await Labourer.find({ companyId: req.companyId, supplierId }).distinct('_id') };
  }

  const rows = await Attendance.find(filter).populate('labourerId', 'name').populate('projectId', 'name').sort({ date: -1 });

  const data = rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    labourer: r.labourerId?.name || '—',
    project: r.projectId?.name || '—',
    status: r.status,
    overtimeHours: r.overtimeHours,
  }));

  return ok(res, { rows: data, count: data.length });
});

export const payrollReport = asyncHandler(async (req, res) => {
  const { month, year, projectId, supplierId, status } = req.query;
  const filter = { companyId: req.companyId };
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (projectId) filter.projectId = projectId;
  if (supplierId) filter.supplierId = supplierId;
  if (status) filter.status = status;

  const rows = await Payroll.find(filter).populate('labourerId', 'name').sort({ year: -1, month: -1 });

  const data = rows.map((r) => ({
    labourer: r.labourerId?.name || '—',
    presentDays: r.presentDays,
    halfDays: r.halfDays,
    absentDays: r.absentDays,
    offDays: r.offDays,
    overtimeHours: r.overtimeHours,
    basicAmount: r.basicAmount,
    overtimeAmount: r.overtimeAmount,
    deductions: r.deductions,
    grossAmount: r.grossAmount,
    paidAmount: r.paidAmount,
    dueAmount: r.dueAmount,
    status: r.status,
  }));

  return ok(res, { rows: data, count: data.length });
});

export const supplierReport = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ companyId: req.companyId, status: 'active' });
  const data = [];

  for (const s of suppliers) {
    const labourerIds = await Labourer.find({ companyId: req.companyId, supplierId: s._id }).distinct('_id');
    const payrollAgg = await Payroll.aggregate([
      { $match: { companyId: req.companyId, labourerId: { $in: labourerIds } } },
      { $group: { _id: null, grossAmount: { $sum: '$grossAmount' }, paidAmount: { $sum: '$paidAmount' }, dueAmount: { $sum: '$dueAmount' } } },
    ]);
    const totals = payrollAgg[0] || { grossAmount: 0, paidAmount: 0, dueAmount: 0 };

    data.push({
      supplier: s.name,
      workers: labourerIds.length,
      totalSalary: round2(totals.grossAmount),
      paid: round2(totals.paidAmount),
      due: round2(totals.dueAmount),
    });
  }

  return ok(res, { rows: data, count: data.length });
});

export const projectReport = asyncHandler(async (req, res) => {
  const projects = await Project.find({ companyId: req.companyId });
  const data = [];

  for (const p of projects) {
    const [workers, attendanceAgg, payrollAgg] = await Promise.all([
      Labourer.countDocuments({ companyId: req.companyId, projectId: p._id }),
      Attendance.aggregate([
        { $match: { companyId: req.companyId, projectId: p._id } },
        { $group: { _id: null, days: { $sum: 1 }, overtimeHours: { $sum: '$overtimeHours' } } },
      ]),
      Payroll.aggregate([
        { $match: { companyId: req.companyId, projectId: p._id } },
        { $group: { _id: null, grossAmount: { $sum: '$grossAmount' }, paidAmount: { $sum: '$paidAmount' }, dueAmount: { $sum: '$dueAmount' } } },
      ]),
    ]);

    const att = attendanceAgg[0] || { days: 0, overtimeHours: 0 };
    const payTotals = payrollAgg[0] || { grossAmount: 0, paidAmount: 0, dueAmount: 0 };

    data.push({
      project: p.name,
      workers,
      attendanceDays: att.days,
      overtimeHours: att.overtimeHours,
      labourCost: round2(payTotals.grossAmount),
      paid: round2(payTotals.paidAmount),
      due: round2(payTotals.dueAmount),
    });
  }

  return ok(res, { rows: data, count: data.length });
});

export const paymentReport = asyncHandler(async (req, res) => {
  const { projectId, labourerId, method } = req.query;
  const filter = { companyId: req.companyId, status: 'active', ...buildDateFilter(req.query, 'paymentDate') };
  if (projectId) filter.projectId = projectId;
  if (labourerId) filter.labourerId = labourerId;
  if (method) filter.method = method;

  const rows = await Payment.find(filter).populate('labourerId', 'name').populate('projectId', 'name').sort({ paymentDate: -1 });

  const data = rows.map((r) => ({
    date: r.paymentDate.toISOString().slice(0, 10),
    labourer: r.labourerId?.name || '—',
    project: r.projectId?.name || '—',
    amount: r.amount,
    method: r.method,
    reference: r.referenceNumber || '—',
  }));

  return ok(res, { rows: data, count: data.length });
});

const REPORT_HANDLERS = {
  attendance: attendanceReport,
  payroll: payrollReport,
  supplier: supplierReport,
  project: projectReport,
  payment: paymentReport,
};

async function collectReportRows(type, req) {
  return new Promise((resolve, reject) => {
    const fakeRes = {
      status: () => fakeRes,
      json: (payload) => resolve(payload.data.rows),
    };
    REPORT_HANDLERS[type](req, fakeRes, reject);
  });
}

export const exportReportExcel = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!REPORT_HANDLERS[type]) return res.status(400).json({ success: false, message: 'Unknown report type' });

  const rows = await collectReportRows(type, req);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(type);

  if (rows.length > 0) {
    sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 18 }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

export const exportReportCsv = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!REPORT_HANDLERS[type]) return res.status(400).json({ success: false, message: 'Unknown report type' });

  const rows = await collectReportRows(type, req);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
  res.send(csv);
});

export const exportReportPdf = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!REPORT_HANDLERS[type]) return res.status(400).json({ success: false, message: 'Unknown report type' });

  const rows = await collectReportRows(type, req);
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);
  doc.pipe(res);

  doc.fontSize(16).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, { align: 'center' });
  doc.moveDown();

  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    doc.fontSize(9);
    doc.text(headers.join(' | '));
    doc.moveDown(0.5);
    rows.forEach((row) => {
      doc.text(headers.map((h) => String(row[h] ?? '')).join(' | '));
    });
  } else {
    doc.text('No data available for the selected filters.');
  }

  doc.end();
});
