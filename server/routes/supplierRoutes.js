import { Router } from 'express';
import {
  listSuppliers,
  createSupplier,
  getSupplier,
  updateSupplier,
  getSupplierSummary,
} from '../controllers/supplierController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { supplierSchema, supplierUpdateSchema } from '../validators/supplierValidators.js';

const router = Router();

router.use(requireAuth);
router.get('/', listSuppliers);
router.post('/', validateBody(supplierSchema), createSupplier);
router.get('/:id', getSupplier);
router.get('/:id/summary', getSupplierSummary);
router.put('/:id', validateBody(supplierUpdateSchema), updateSupplier);

export default router;
