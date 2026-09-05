import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { settingsSchema } from '../validators/settingsValidators.js';

const router = Router();

router.use(requireAuth);
router.get('/', getSettings);
router.put('/', requireRole('owner'), validateBody(settingsSchema), updateSettings);

export default router;
