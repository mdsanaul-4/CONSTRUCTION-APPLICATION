import { Router } from 'express';
import { login, getMe, changePassword, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema } from '../validators/authValidators.js';

const router = Router();

router.get('/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login route exists'
  });
});

router.post('/login', validateBody(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), changePassword);
router.post('/logout', requireAuth, logout);

export default router;
