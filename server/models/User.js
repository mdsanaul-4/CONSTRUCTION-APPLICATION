import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['owner', 'manager', 'accountant', 'supervisor'],
      default: 'owner',
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    isActive: { type: Boolean, default: true },
    // Explicit permissions let the owner control exactly what non-owner users can access.
    // An empty array uses the role's safe defaults; owner always has full access.
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
