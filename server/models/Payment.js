import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    labourerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labourer', required: true, index: true },
    payrollId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payroll', index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },

    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, default: Date.now, index: true },

    method: { type: String, enum: ['cash', 'bank', 'upi', 'other'], default: 'cash' },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, trim: true },

    // Payments are never hard-deleted. A mistaken payment is voided instead,
    // which keeps the historical record but excludes it from totals.
    status: { type: String, enum: ['active', 'voided'], default: 'active', index: true },
    voidedAt: { type: Date },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voidReason: { type: String, trim: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentSchema.index({ companyId: 1, paymentDate: 1 });
paymentSchema.index({ companyId: 1, labourerId: 1, status: 1 });

export default mongoose.model('Payment', paymentSchema);
