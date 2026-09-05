import { Router } from 'express';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deactivateProject,
  getProjectSummary,
} from '../controllers/projectController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { projectSchema, projectUpdateSchema } from '../validators/projectValidators.js';

const router = Router();

router.use(requireAuth);
router.get('/', listProjects);
router.post('/', validateBody(projectSchema), createProject);
router.get('/:id', getProject);
router.get('/:id/summary', getProjectSummary);
router.put('/:id', validateBody(projectUpdateSchema), updateProject);
router.patch('/:id/status', deactivateProject);

export default router;
