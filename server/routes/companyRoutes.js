import { Router } from 'express';
import { getCompany, updateCompany } from '../controllers/companyController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getCompany);
router.put('/', updateCompany);

export default router;
