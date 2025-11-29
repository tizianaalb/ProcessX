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

export default router;
