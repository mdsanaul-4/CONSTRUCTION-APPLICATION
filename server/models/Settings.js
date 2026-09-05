import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },

    weeklyOffPaid: { type: Boolean, default: false },
    holidayPaid: { type: Boolean, default: true },

    defaultOvertimeRate: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },

    companyName: { type: String, default: 'Construction Labour Manager' },
    companyPhone: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
