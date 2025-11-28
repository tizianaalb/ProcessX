import { Router } from 'express';
import {
  getProcesses,
  getProcess,
  createProcess,
  updateProcess,
  deleteProcess,
  addProcessSteps,
  addProcessConnections,
} from '../controllers/process.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Process CRUD
router.get('/', getProcesses);
router.get('/:id', getProcess);
router.post('/', createProcess);
router.put('/:id', updateProcess);
router.delete('/:id', deleteProcess);

// Process steps and connections
router.post('/:id/steps', addProcessSteps);
router.post('/:id/connections', addProcessConnections);

export default router;
