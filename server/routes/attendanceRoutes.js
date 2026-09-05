import { Router } from 'express';
import {
  getAttendanceSheet,
  saveBulkAttendance,
  listAttendance,
  updateAttendanceRecord,
} from '../controllers/attendanceController.js';
import { requireAuth, requirePermission, requireAttendanceWrite } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { bulkAttendanceSchema } from '../validators/attendanceValidators.js';

const router = Router();

router.use(requireAuth);
router.get('/sheet', requirePermission('attendance.view'), getAttendanceSheet);
router.post('/bulk', requireAttendanceWrite, validateBody(bulkAttendanceSchema), saveBulkAttendance);
router.get('/', requirePermission('attendance.view'), listAttendance);
router.put('/:id', requirePermission('attendance.update'), updateAttendanceRecord);

export default router;
