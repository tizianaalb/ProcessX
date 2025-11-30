import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as exportController from '../controllers/export.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/processes/:processId/export/powerpoint - Export as PowerPoint
router.post(
  '/processes/:processId/export/powerpoint',
  exportController.exportPowerPoint
);

// POST /api/processes/:processId/export/pdf - Export as PDF
router.post(
  '/processes/:processId/export/pdf',
  exportController.exportPDF
);

// POST /api/processes/:processId/export/excel - Export as Excel
router.post(
  '/processes/:processId/export/excel',
  exportController.exportExcel
);

// POST /api/processes/:processId/export/word - Export as Word
router.post(
  '/processes/:processId/export/word',
  exportController.exportWord
);

// GET /api/processes/:processId/export/history - Get export history
router.get(
  '/processes/:processId/export/history',
  exportController.getExportHistory
);

// Analysis Export Routes
// GET /api/analyses/:analysisId/export/markdown - Export analysis as Markdown
router.get(
  '/analyses/:analysisId/export/markdown',
  exportController.exportAnalysisMarkdown
);

// GET /api/analyses/:analysisId/export/powerpoint - Export analysis as PowerPoint
router.get(
  '/analyses/:analysisId/export/powerpoint',
  exportController.exportAnalysisPowerPoint
);

// GET /api/analyses/:analysisId/export/pdf - Export analysis as PDF
router.get(
  '/analyses/:analysisId/export/pdf',
  exportController.exportAnalysisPDF
);

// GET /api/analyses/:analysisId/export/excel - Export analysis as Excel
router.get(
  '/analyses/:analysisId/export/excel',
  exportController.exportAnalysisExcel
);

// GET /api/analyses/:analysisId/export/word - Export analysis as Word
router.get(
  '/analyses/:analysisId/export/word',
  exportController.exportAnalysisWord
);

export default router;
