import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    labourerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labourer', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },

    // Normalized to midnight UTC of the business date to avoid timezone drift.
    date: { type: Date, required: true },

    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'off', 'holiday'],
      required: true,
    },

    overtimeHours: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent duplicate attendance for the same company + labourer + date.
attendanceSchema.index({ companyId: 1, labourerId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, projectId: 1, date: 1 });
attendanceSchema.index({ companyId: 1, date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
