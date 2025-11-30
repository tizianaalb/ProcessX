import { Router } from 'express';
import { generateProcessFromDescription } from '../controllers/ai-generation.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// AI process generation
router.post('/generate-from-description', generateProcessFromDescription);

export default router;
