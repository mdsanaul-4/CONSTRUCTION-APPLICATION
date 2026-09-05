import { Router } from 'express';
import {
  listLabourers,
  createLabourer,
  getLabourer,
  updateLabourer,
  deactivateLabourer,
  getLabourerProfile,
} from '../controllers/labourerController.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { labourerSchema, labourerUpdateSchema } from '../validators/labourerValidators.js';

const router = Router();

router.use(requireAuth);
router.get('/', requirePermission('labourers.view'), listLabourers);
router.post('/', requirePermission('labourers.create'), validateBody(labourerSchema), createLabourer);
router.get('/:id', requirePermission('labourers.view'), getLabourer);
router.get('/:id/profile', requirePermission('labourers.view'), getLabourerProfile);
router.put('/:id', requirePermission('labourers.update'), validateBody(labourerUpdateSchema), updateLabourer);
router.patch('/:id/status', requirePermission('labourers.delete'), deactivateLabourer);

export default router;
