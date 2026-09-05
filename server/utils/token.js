import jwt from 'jsonwebtoken';

export function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), companyId: user.companyId.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
