import mongoose from 'mongoose';

const labourerSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },

    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    // Stored as a base64 data URL so no separate file-storage setup is required.
    photo: { type: String, default: '' },

    dailyRate: { type: Number, required: true, min: 0 },
    overtimeRate: { type: Number, required: true, min: 0, default: 0 },

    joiningDate: { type: Date },
    leavingDate: { type: Date },

    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

labourerSchema.index({ companyId: 1, status: 1 });
labourerSchema.index({ companyId: 1, supplierId: 1 });
labourerSchema.index({ companyId: 1, projectId: 1 });
labourerSchema.index({ companyId: 1, name: 'text', phone: 'text' });

export default mongoose.model('Labourer', labourerSchema);
