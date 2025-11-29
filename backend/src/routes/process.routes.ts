import { Router } from 'express';
import {
  getProcesses,
  getProcess,
  createProcess,
  updateProcess,
  deleteProcess,
  addProcessSteps,
  updateProcessSteps,
  addProcessConnections,
  deleteProcessStep,
  deleteProcessConnection,
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
router.put('/:id/steps', updateProcessSteps);
router.post('/:id/connections', addProcessConnections);

// Create step and connection routes
const stepRouter = Router();
stepRouter.use(authenticate);
stepRouter.delete('/:id', deleteProcessStep);

const connectionRouter = Router();
connectionRouter.use(authenticate);
connectionRouter.delete('/:id', deleteProcessConnection);

export default router;
export { stepRouter, connectionRouter };
