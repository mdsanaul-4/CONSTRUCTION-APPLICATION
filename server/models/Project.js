import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    clientName: { type: String, trim: true },
    location: { type: String, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date },
    expectedEndDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'completed', 'on_hold'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

projectSchema.index({ companyId: 1, status: 1 });
projectSchema.index({ companyId: 1, name: 'text', clientName: 'text', location: 'text' });

export default mongoose.model('Project', projectSchema);
