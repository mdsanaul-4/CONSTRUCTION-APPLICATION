import { Router } from 'express';
import { listPayments, createPayment, getPayment, voidPayment } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { paymentSchema, voidPaymentSchema } from '../validators/payrollValidators.js';

const router = Router();

router.use(requireAuth);
router.get('/', listPayments);
router.post('/', validateBody(paymentSchema), createPayment);
router.get('/:id', getPayment);
router.post('/:id/void', validateBody(voidPaymentSchema), voidPayment);

export default router;
