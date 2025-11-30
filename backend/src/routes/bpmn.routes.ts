import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as bpmnController from '../controllers/bpmn.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/processes/:processId/export/bpmn - Export process as BPMN
router.get(
  '/processes/:processId/export/bpmn',
  bpmnController.exportBPMN
);

// POST /api/bpmn/import - Import BPMN file to create a new process
router.post(
  '/bpmn/import',
  bpmnController.uploadMiddleware,
  bpmnController.importBPMN
);

export default router;
