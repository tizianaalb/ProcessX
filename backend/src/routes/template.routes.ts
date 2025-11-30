import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  useTemplate,
} from '../controllers/template.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Template CRUD
router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

// Use template to create a process
router.post('/:id/use', useTemplate);

export default router;
