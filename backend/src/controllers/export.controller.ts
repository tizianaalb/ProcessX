import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ExportService } from '../services/export.service';

/**
 * Export process as PowerPoint
 */
export const exportPowerPoint = async (req: Request, res: Response) => {
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

    // Generate PowerPoint
    const buffer = await ExportService.generatePowerPoint(processId, user.organizationId);

    // Log export
    await prisma.export.create({
      data: {
        processId,
        userId,
        exportType: 'pptx',
        fileSizeBytes: BigInt(buffer.length),
        status: 'completed',
      },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${process.name.replace(/[^a-z0-9]/gi, '_')}_analysis.pptx"`);
    res.send(buffer);
  } catch (error) {
    console.error('PowerPoint export error:', error);
    res.status(500).json({
      error: 'Failed to generate PowerPoint',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Export process as PDF
 */
export const exportPDF = async (req: Request, res: Response) => {
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

    // Generate PDF
    const buffer = await ExportService.generatePDF(processId, user.organizationId);

    // Log export
    await prisma.export.create({
      data: {
        processId,
        userId,
        exportType: 'pdf',
        fileSizeBytes: BigInt(buffer.length),
        status: 'completed',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${process.name.replace(/[^a-z0-9]/gi, '_')}_analysis.pdf"`);
    res.send(buffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Export process as Excel
 */
export const exportExcel = async (req: Request, res: Response) => {
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

    // Generate Excel
    const buffer = await ExportService.generateExcel(processId, user.organizationId);

    // Log export
    await prisma.export.create({
      data: {
        processId,
        userId,
        exportType: 'xlsx',
        fileSizeBytes: BigInt(buffer.length),
        status: 'completed',
      },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${process.name.replace(/[^a-z0-9]/gi, '_')}_analysis.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({
      error: 'Failed to generate Excel',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Export process as Word
 */
export const exportWord = async (req: Request, res: Response) => {
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

    // Generate Word
    const buffer = await ExportService.generateWord(processId, user.organizationId);

    // Log export
    await prisma.export.create({
      data: {
        processId,
        userId,
        exportType: 'docx',
        fileSizeBytes: BigInt(buffer.length),
        status: 'completed',
      },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${process.name.replace(/[^a-z0-9]/gi, '_')}_analysis.docx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Word export error:', error);
    res.status(500).json({
      error: 'Failed to generate Word document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get export history for a process
 */
export const getExportHistory = async (req: Request, res: Response) => {
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

    const exports = await prisma.export.findMany({
      where: {
        processId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    res.json({
      success: true,
      exports: exports.map((exp) => ({
        ...exp,
        fileSizeBytes: exp.fileSizeBytes?.toString(),
      })),
    });
  } catch (error) {
    console.error('Get export history error:', error);
    res.status(500).json({ error: 'Failed to retrieve export history' });
  }
};
