import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as recommendationController from '../controllers/recommendation.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// NOTE: /processes/:processId/analyze is now handled by ai-analysis.routes.ts

// POST /api/processes/:processId/recommendations - Generate recommendations
router.post(
  '/processes/:processId/recommendations',
  recommendationController.generateRecommendations
);

// GET /api/processes/:processId/recommendations - Get all recommendations
router.get(
  '/processes/:processId/recommendations',
  recommendationController.getRecommendations
);

// PATCH /api/recommendations/:recommendationId/status - Update recommendation status
router.patch(
  '/recommendations/:recommendationId/status',
  recommendationController.updateRecommendationStatus
);

// POST /api/processes/:processId/target - Generate target (TO_BE) process
router.post(
  '/processes/:processId/target',
  recommendationController.generateTargetProcess
);

// GET /api/processes/:processId/target - Get target processes
router.get(
  '/processes/:processId/target',
  recommendationController.getTargetProcesses
);

export default router;
