import { Router } from 'express';
import {
  generatePayroll,
  listPayroll,
  getPayroll,
  updatePayrollDraft,
  finalizePayroll,
  reopenPayroll,
} from '../controllers/payrollController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { generatePayrollSchema, updatePayrollSchema } from '../validators/payrollValidators.js';

const router = Router();

router.use(requireAuth);
router.post('/generate', validateBody(generatePayrollSchema), generatePayroll);
router.get('/', listPayroll);
router.get('/:id', getPayroll);
router.put('/:id', validateBody(updatePayrollSchema), updatePayrollDraft);
router.post('/:id/finalize', finalizePayroll);
router.post('/:id/reopen', reopenPayroll);

export default router;
