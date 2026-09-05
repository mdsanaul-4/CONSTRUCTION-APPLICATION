import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    labourerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labourer', required: true, index: true },

    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },

    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },

    presentDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    offDays: { type: Number, default: 0 },
    holidayDays: { type: Number, default: 0 },

    overtimeHours: { type: Number, default: 0 },

    // Snapshot of rates at the time payroll was generated/finalized, so future
    // rate changes never retroactively alter historical payroll.
    dailyRateAtPayroll: { type: Number, required: true },
    overtimeRateAtPayroll: { type: Number, required: true },

    basicAmount: { type: Number, default: 0 },
    overtimeAmount: { type: Number, default: 0 },
    otherEarnings: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },

    grossAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    weeklyOffPaidApplied: { type: Boolean, default: false },
    holidayPaidApplied: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['draft', 'finalized', 'partially_paid', 'paid'],
      default: 'draft',
      index: true,
    },

    finalizedAt: { type: Date },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One payroll record per labourer per month/year — prevents duplicate monthly payroll.
payrollSchema.index({ companyId: 1, labourerId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ companyId: 1, month: 1, year: 1 });
payrollSchema.index({ companyId: 1, projectId: 1 });
payrollSchema.index({ companyId: 1, supplierId: 1 });
payrollSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('Payroll', payrollSchema);
