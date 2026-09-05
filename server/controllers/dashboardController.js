import Labourer from '../models/Labourer.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Payment from '../models/Payment.js';
import AuditLog from '../models/AuditLog.js';
import { ok } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { todayRange } from '../utils/dateUtils.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const { start, end } = todayRange();
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const [totalLabourers, activeLabourers, todayAttendance, monthPayroll, recentPayments, recentActivity] = await Promise.all([
    Labourer.countDocuments({ companyId }),
    Labourer.countDocuments({ companyId, status: 'active' }),
    Attendance.aggregate([
      { $match: { companyId, date: { $gte: start, $lt: end } } },
      { $group: { _id: '$status', count: { $sum: 1 }, overtimeHours: { $sum: '$overtimeHours' } } },
    ]),
    Payroll.aggregate([
      { $match: { companyId, month, year } },
      { $group: { _id: null, grossAmount: { $sum: '$grossAmount' }, paidAmount: { $sum: '$paidAmount' }, dueAmount: { $sum: '$dueAmount' } } },
    ]),
    Payment.find({ companyId, status: 'active' }).populate('labourerId', 'name').sort({ paymentDate: -1 }).limit(8),
    AuditLog.find({ companyId }).sort({ createdAt: -1 }).limit(10),
  ]);

  const attendanceMap = { present: 0, absent: 0, off: 0, half_day: 0, holiday: 0 };
  let todayOvertimeHours = 0;
  for (const row of todayAttendance) {
    if (attendanceMap[row._id] !== undefined) attendanceMap[row._id] = row.count;
    todayOvertimeHours += row.overtimeHours || 0;
  }

  const payrollTotals = monthPayroll[0] || { grossAmount: 0, paidAmount: 0, dueAmount: 0 };

  return ok(res, {
    cards: {
      totalLabourers,
      activeLabourers,
      presentToday: attendanceMap.present,
      absentToday: attendanceMap.absent,
      offToday: attendanceMap.off,
      halfDayToday: attendanceMap.half_day,
      overtimeHoursToday: todayOvertimeHours,
      monthLabourCost: payrollTotals.grossAmount,
      monthPaidAmount: payrollTotals.paidAmount,
      monthOutstandingAmount: payrollTotals.dueAmount,
    },
    todayAttendanceBreakdown: attendanceMap,
    recentPayments,
    recentActivity,
  });
});

// Last 6 months labour cost, used for the dashboard trend chart.
export const getMonthlyCostTrend = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const now = new Date();
  const points = [];

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    points.push({ month: d.getUTCMonth() + 1, year: d.getUTCFullYear() });
  }

  const agg = await Payroll.aggregate([
    { $match: { companyId } },
    { $group: { _id: { month: '$month', year: '$year' }, grossAmount: { $sum: '$grossAmount' } } },
  ]);

  const map = new Map(agg.map((a) => [`${a._id.month}-${a._id.year}`, a.grossAmount]));

  const series = points.map((p) => ({
    label: `${p.month}/${p.year}`,
    month: p.month,
    year: p.year,
    grossAmount: map.get(`${p.month}-${p.year}`) || 0,
  }));

  return ok(res, { series });
});
