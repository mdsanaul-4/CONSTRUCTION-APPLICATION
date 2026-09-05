import { Router } from 'express';
import { getDashboard, getMonthlyCostTrend } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getDashboard);
router.get('/trend', getMonthlyCostTrend);

export default router;
