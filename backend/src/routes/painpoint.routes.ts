import { Router } from 'express';
import {
  getPainPoints,
  getPainPoint,
  createPainPoint,
  updatePainPoint,
  deletePainPoint,
} from '../controllers/painpoint.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Pain point routes for a specific process
router.get('/processes/:processId/pain-points', getPainPoints);
router.post('/processes/:processId/pain-points', createPainPoint);

// Individual pain point operations
router.get('/pain-points/:id', getPainPoint);
router.put('/pain-points/:id', updatePainPoint);
router.delete('/pain-points/:id', deletePainPoint);

export default router;
