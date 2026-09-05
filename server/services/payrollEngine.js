/**
 * Pure payroll calculation functions. No DB access here so they are easy to
 * unit test and guaranteed to be the single source of truth for money math.
 * The backend ALWAYS recomputes these values from attendance + settings;
 * it never trusts amounts sent from the frontend.
 */

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Summarize a list of attendance records into day-type counts + OT hours.
 */
export function summarizeAttendance(attendanceRecords) {
  const summary = {
    presentDays: 0,
    halfDays: 0,
    absentDays: 0,
    offDays: 0,
    holidayDays: 0,
    overtimeHours: 0,
  };

  for (const rec of attendanceRecords) {
    switch (rec.status) {
      case 'present':
        summary.presentDays += 1;
        break;
      case 'half_day':
        summary.halfDays += 1;
        break;
      case 'absent':
        summary.absentDays += 1;
        break;
      case 'off':
        summary.offDays += 1;
        break;
      case 'holiday':
        summary.holidayDays += 1;
        break;
      default:
        break;
    }
    summary.overtimeHours += rec.overtimeHours || 0;
  }

  return summary;
}

/**
 * Calculate the full payroll breakdown for one labourer for one month.
 *
 * @param {object} params
 * @param {object} params.summary - output of summarizeAttendance
 * @param {number} params.dailyRate
 * @param {number} params.overtimeRate
 * @param {number} params.otherEarnings
 * @param {number} params.deductions
 * @param {boolean} params.weeklyOffPaid
 * @param {boolean} params.holidayPaid
 */
export function calculatePayroll({
  summary,
  dailyRate,
  overtimeRate,
  otherEarnings = 0,
  deductions = 0,
  weeklyOffPaid = false,
  holidayPaid = true,
}) {
  const presentPay = summary.presentDays * dailyRate;
  const halfDayPay = summary.halfDays * dailyRate * 0.5;
  const offDayPay = weeklyOffPaid ? summary.offDays * dailyRate : 0;
  const holidayPay = holidayPaid ? summary.holidayDays * dailyRate : 0;
  const overtimeAmount = summary.overtimeHours * overtimeRate;

  const basicAmount = round2(presentPay + halfDayPay + offDayPay + holidayPay);
  const grossAmount = round2(basicAmount + overtimeAmount + otherEarnings - deductions);

  return {
    basicAmount,
    overtimeAmount: round2(overtimeAmount),
    grossAmount: grossAmount < 0 ? 0 : grossAmount,
  };
}

/**
 * Derive paid/due amounts and status from gross amount and active payments.
 */
export function calculatePaymentStatus({ grossAmount, totalPaid }) {
  const paidAmount = round2(totalPaid);
  const dueAmount = round2(Math.max(grossAmount - paidAmount, 0));

  let status;
  if (paidAmount <= 0) status = 'finalized';
  else if (dueAmount <= 0) status = 'paid';
  else status = 'partially_paid';

  return { paidAmount, dueAmount, status };
}
