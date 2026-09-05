import AuditLog from '../models/AuditLog.js';

export async function logActivity({ req, action, entityType, entityId, oldData = null, newData = null }) {
  try {
    await AuditLog.create({
      companyId: req.user.companyId,
      userId: req.user._id,
      action,
      entityType,
      entityId,
      oldData,
      newData,
      ip: req.ip,
    });
  } catch (err) {
    // Audit logging must never break the main request flow.
    console.error('Failed to write audit log:', err.message);
  }
}
