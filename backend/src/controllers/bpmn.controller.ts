import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { BPMNService } from '../services/bpmn.service';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/xml' || file.mimetype === 'application/xml' || file.originalname.endsWith('.bpmn')) {
      cb(null, true);
    } else {
      cb(new Error('Only XML/BPMN files are allowed'));
    }
  },
});

export const uploadMiddleware = upload.single('bpmnFile');

/**
 * Export process to BPMN 2.0 XML
 */
export const exportBPMN = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;
    const userId = (req as any).user.userId;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify process belongs to organization
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId: user.organizationId,
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    // Generate BPMN XML
    const bpmnXml = await BPMNService.exportToBPMN(processId, user.organizationId);

    // Log export
    await prisma.export.create({
      data: {
        processId,
        userId,
        exportType: 'bpmn',
        fileSizeBytes: BigInt(Buffer.byteLength(bpmnXml, 'utf8')),
        status: 'completed',
      },
    });

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${process.name.replace(/[^a-z0-9]/gi, '_')}.bpmn"`
    );
    res.send(bpmnXml);
  } catch (error) {
    console.error('BPMN export error:', error);
    res.status(500).json({
      error: 'Failed to generate BPMN',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Import BPMN 2.0 XML to create a new process
 */
export const importBPMN = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file content
    const xmlContent = req.file.buffer.toString('utf-8');

    // Import BPMN
    const result = await BPMNService.importFromBPMN(
      xmlContent,
      user.organizationId,
      userId
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('BPMN import error:', error);
    res.status(500).json({
      error: 'Failed to import BPMN',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
