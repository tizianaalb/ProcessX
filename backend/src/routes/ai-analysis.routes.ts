import { Router } from 'express';
import * as aiAnalysisController from '../controllers/ai-analysis.controller';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Process Analysis Routes
 */

// Start AI analysis for a process
router.post('/processes/:processId/analyze', aiAnalysisController.startAnalysis);

// Get all analyses for a process
router.get('/processes/:processId/analyses', aiAnalysisController.getProcessAnalyses);

// Get recommendations for a process
router.get('/processes/:processId/recommendations', aiAnalysisController.getProcessRecommendations);

/**
 * Analysis Routes
 */

// Get specific analysis result
router.get('/analyses/:analysisId', aiAnalysisController.getAnalysis);

/**
 * Recommendation Routes
 */

// Approve recommendation
router.post('/recommendations/:recommendationId/approve', aiAnalysisController.approveRecommendation);

// Reject recommendation
router.post('/recommendations/:recommendationId/reject', aiAnalysisController.rejectRecommendation);

// Mark recommendation as implemented
router.post('/recommendations/:recommendationId/implement', aiAnalysisController.implementRecommendation);

export default router;
