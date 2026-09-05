import { summarizeAttendance, calculatePayroll, calculatePaymentStatus, round2 } from '../services/payrollEngine.js';

describe('payrollEngine.summarizeAttendance', () => {
  test('counts each attendance status correctly', () => {
    const records = [
      { status: 'present', overtimeHours: 2 },
      { status: 'present', overtimeHours: 1 },
      { status: 'absent', overtimeHours: 0 },
      { status: 'half_day', overtimeHours: 0 },
      { status: 'off', overtimeHours: 0 },
      { status: 'holiday', overtimeHours: 0 },
    ];

    const summary = summarizeAttendance(records);

    expect(summary.presentDays).toBe(2);
    expect(summary.absentDays).toBe(1);
    expect(summary.halfDays).toBe(1);
    expect(summary.offDays).toBe(1);
    expect(summary.holidayDays).toBe(1);
    expect(summary.overtimeHours).toBe(3);
  });

  test('returns all zeros for empty input', () => {
    const summary = summarizeAttendance([]);
    expect(summary).toEqual({
      presentDays: 0,
      halfDays: 0,
      absentDays: 0,
      offDays: 0,
      holidayDays: 0,
      overtimeHours: 0,
    });
  });
});

describe('payrollEngine.calculatePayroll', () => {
  test('present days pay = presentDays * dailyRate', () => {
    const result = calculatePayroll({
      summary: { presentDays: 20, halfDays: 0, absentDays: 0, offDays: 0, holidayDays: 0, overtimeHours: 0 },
      dailyRate: 700,
      overtimeRate: 100,
    });
    expect(result.basicAmount).toBe(14000);
    expect(result.grossAmount).toBe(14000);
  });

  test('half day pay = halfDays * dailyRate * 0.5', () => {
    const result = calculatePayroll({
      summary: { presentDays: 0, halfDays: 4, absentDays: 0, offDays: 0, holidayDays: 0, overtimeHours: 0 },
      dailyRate: 700,
      overtimeRate: 100,
    });
    expect(result.basicAmount).toBe(1400); // 4 * 700 * 0.5
  });

  test('overtime pay = overtimeHours * overtimeRate', () => {
    const result = calculatePayroll({
      summary: { presentDays: 0, halfDays: 0, absentDays: 0, offDays: 0, holidayDays: 0, overtimeHours: 5 },
      dailyRate: 700,
      overtimeRate: 100,
    });
    expect(result.overtimeAmount).toBe(500);
    expect(result.grossAmount).toBe(500);
  });

  test('weekly off is unpaid by default', () => {
    const result = calculatePayroll({
      summary: { presentDays: 0, halfDays: 0, absentDays: 0, offDays: 4, holidayDays: 0, overtimeHours: 0 },
      dailyRate: 700,
      overtimeRate: 100,
      weeklyOffPaid: false,
    });
    expect(result.basicAmount).toBe(0);
  });

  test('weekly off is paid when weeklyOffPaid=true', () => {
    const result = calculatePayroll({
      summary: { presentDays: 0, halfDays: 0, absentDays: 0, offDays: 4, holidayDays: 0, overtimeHours: 0 },
      dailyRate: 700,
      overtimeRate: 100,
      weeklyOffPaid: true,
    });
    expect(result.basicAmount).toBe(2800);
  });

  test('holiday is paid by default', () => {
    const result = calculatePayroll({
      summary: { presentDays: 0, halfDays: 0, absentDays: 0, offDays: 0, holidayDays: 2, overtimeHours: 0 },
      dailyRate: 500,
      overtimeRate: 50,
      holidayPaid: true,
    });
    expect(result.basicAmount).toBe(1000);
  });

  test('absent days never contribute to pay', () => {
    const result = calculatePayroll({
      summary: { presentDays: 0, halfDays: 0, absentDays: 10, offDays: 0, holidayDays: 0, overtimeHours: 0 },
      dailyRate: 700,
      overtimeRate: 100,
    });
    expect(result.grossAmount).toBe(0);
  });

  test('gross salary combines all components and subtracts deductions', () => {
    const result = calculatePayroll({
      summary: { presentDays: 20, halfDays: 2, absentDays: 3, offDays: 4, holidayDays: 1, overtimeHours: 10 },
      dailyRate: 700,
      overtimeRate: 100,
      otherEarnings: 500,
      deductions: 200,
      weeklyOffPaid: false,
      holidayPaid: true,
    });

    // present 20*700=14000, half 2*700*0.5=700, holiday 1*700=700, OT 10*100=1000
    // basic = 14000+700+0+700 = 15400
    expect(result.basicAmount).toBe(15400);
    expect(result.overtimeAmount).toBe(1000);
    // gross = 15400+1000+500-200 = 16700
    expect(result.grossAmount).toBe(16700);
  });

  test('gross salary never goes negative', () => {
    const result = calculatePayroll({
      summary: { presentDays: 1, halfDays: 0, absentDays: 0, offDays: 0, holidayDays: 0, overtimeHours: 0 },
      dailyRate: 100,
      overtimeRate: 0,
      deductions: 10000,
    });
    expect(result.grossAmount).toBe(0);
  });
});

describe('payrollEngine.calculatePaymentStatus', () => {
  test('due = gross - paid', () => {
    const result = calculatePaymentStatus({ grossAmount: 18000, totalPaid: 13000 });
    expect(result.paidAmount).toBe(13000);
    expect(result.dueAmount).toBe(5000);
    expect(result.status).toBe('partially_paid');
  });

  test('status is paid when due is zero', () => {
    const result = calculatePaymentStatus({ grossAmount: 10000, totalPaid: 10000 });
    expect(result.dueAmount).toBe(0);
    expect(result.status).toBe('paid');
  });

  test('status is finalized when nothing has been paid yet', () => {
    const result = calculatePaymentStatus({ grossAmount: 10000, totalPaid: 0 });
    expect(result.status).toBe('finalized');
  });

  test('due never goes negative even if overpaid', () => {
    const result = calculatePaymentStatus({ grossAmount: 5000, totalPaid: 7000 });
    expect(result.dueAmount).toBe(0);
  });
});

describe('round2', () => {
  test('rounds to two decimal places', () => {
    expect(round2(100.005)).toBeCloseTo(100.01, 2);
    expect(round2(99.999)).toBeCloseTo(100.0, 2);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});
