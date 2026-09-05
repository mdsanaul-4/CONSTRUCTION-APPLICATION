import { Router } from 'express';
import {
  attendanceReport,
  payrollReport,
  supplierReport,
  projectReport,
  paymentReport,
  exportReportExcel,
  exportReportCsv,
  exportReportPdf,
} from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/attendance', attendanceReport);
router.get('/payroll', payrollReport);
router.get('/supplier', supplierReport);
router.get('/project', projectReport);
router.get('/payment', paymentReport);

router.get('/:type/export/excel', exportReportExcel);
router.get('/:type/export/csv', exportReportCsv);
router.get('/:type/export/pdf', exportReportPdf);

export default router;
