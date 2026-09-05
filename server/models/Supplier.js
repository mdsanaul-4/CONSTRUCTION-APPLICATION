import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

supplierSchema.index({ companyId: 1, status: 1 });
supplierSchema.index({ companyId: 1, name: 'text' });

export default mongoose.model('Supplier', supplierSchema);
