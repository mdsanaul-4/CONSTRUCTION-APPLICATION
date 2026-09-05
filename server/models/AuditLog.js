import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },

    oldData: { type: mongoose.Schema.Types.Mixed },
    newData: { type: mongoose.Schema.Types.Mixed },

    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ companyId: 1, createdAt: -1 });
auditLogSchema.index({ companyId: 1, entityType: 1, entityId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
