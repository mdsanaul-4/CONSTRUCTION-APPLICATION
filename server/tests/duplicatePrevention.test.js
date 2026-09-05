import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from './testDb.js';
import Company from '../models/Company.js';
import Labourer from '../models/Labourer.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';

let companyId;
let labourerId;

beforeAll(async () => {
  await connectTestDB();
  const company = await Company.create({ name: 'Test Co' });
  companyId = company._id;

  const labourer = await Labourer.create({
    companyId,
    name: 'Test Labourer',
    dailyRate: 700,
    overtimeRate: 100,
    joiningDate: new Date(),
  });
  labourerId = labourer._id;
});

afterEach(async () => {
  await Attendance.deleteMany({});
  await Payroll.deleteMany({});
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Attendance duplicate prevention', () => {
  test('allows one attendance record per labourer per date', async () => {
    const date = new Date(Date.UTC(2026, 0, 15));
    await Attendance.create({ companyId, labourerId, date, status: 'present', overtimeHours: 2 });

    const count = await Attendance.countDocuments({ companyId, labourerId, date });
    expect(count).toBe(1);
  });

  test('rejects a second attendance record for the same company+labourer+date', async () => {
    const date = new Date(Date.UTC(2026, 0, 16));
    await Attendance.create({ companyId, labourerId, date, status: 'present', overtimeHours: 0 });

    await expect(
      Attendance.create({ companyId, labourerId, date, status: 'absent', overtimeHours: 0 })
    ).rejects.toThrow();
  });

  test('allows attendance for a different date for the same labourer', async () => {
    const date1 = new Date(Date.UTC(2026, 0, 17));
    const date2 = new Date(Date.UTC(2026, 0, 18));
    await Attendance.create({ companyId, labourerId, date: date1, status: 'present', overtimeHours: 0 });
    await expect(
      Attendance.create({ companyId, labourerId, date: date2, status: 'present', overtimeHours: 0 })
    ).resolves.toBeDefined();
  });
});

describe('Payroll duplicate prevention', () => {
  test('allows one payroll record per labourer per month/year', async () => {
    await Payroll.create({
      companyId,
      labourerId,
      month: 1,
      year: 2026,
      dailyRateAtPayroll: 700,
      overtimeRateAtPayroll: 100,
    });

    const count = await Payroll.countDocuments({ companyId, labourerId, month: 1, year: 2026 });
    expect(count).toBe(1);
  });

  test('rejects a second payroll record for the same labourer+month+year', async () => {
    await Payroll.create({
      companyId,
      labourerId,
      month: 2,
      year: 2026,
      dailyRateAtPayroll: 700,
      overtimeRateAtPayroll: 100,
    });

    await expect(
      Payroll.create({
        companyId,
        labourerId,
        month: 2,
        year: 2026,
        dailyRateAtPayroll: 700,
        overtimeRateAtPayroll: 100,
      })
    ).rejects.toThrow();
  });

  test('historical payroll snapshot rate does not change when labourer rate changes later', async () => {
    const payroll = await Payroll.create({
      companyId,
      labourerId,
      month: 3,
      year: 2026,
      dailyRateAtPayroll: 700,
      overtimeRateAtPayroll: 100,
      basicAmount: 14000,
      grossAmount: 14000,
    });

    await Labourer.findByIdAndUpdate(labourerId, { dailyRate: 900 });

    const reloaded = await Payroll.findById(payroll._id);
    expect(reloaded.dailyRateAtPayroll).toBe(700);
    expect(reloaded.grossAmount).toBe(14000);

    const labourer = await Labourer.findById(labourerId);
    expect(labourer.dailyRate).toBe(900);
  });
});
