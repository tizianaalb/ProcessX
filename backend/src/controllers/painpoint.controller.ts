import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';

// Validation schemas
const createPainPointSchema = z.object({
  processStepId: z.string().uuid().optional(),
  category: z.enum([
    'BOTTLENECK',
    'REWORK',
    'WASTE',
    'MANUAL_PROCESS',
    'COMPLIANCE_RISK',
    'SYSTEM_LIMITATION',
    'COMMUNICATION_GAP',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  impact: z.string().optional(),
  estimatedCost: z.number().int().min(0).optional(),
  estimatedTime: z.number().int().min(0).optional(),
  frequency: z
    .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'])
    .optional(),
});

const updatePainPointSchema = z.object({
  category: z
    .enum([
      'BOTTLENECK',
      'REWORK',
      'WASTE',
      'MANUAL_PROCESS',
      'COMPLIANCE_RISK',
      'SYSTEM_LIMITATION',
      'COMMUNICATION_GAP',
    ])
    .optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  impact: z.string().optional(),
  estimatedCost: z.number().int().min(0).optional(),
  estimatedTime: z.number().int().min(0).optional(),
  frequency: z
    .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'])
    .optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']).optional(),
});

// Get all pain points for a process
export const getPainPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { processId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify process belongs to organization
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId,
      },
    });

    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    const painPoints = await prisma.painPoint.findMany({
      where: {
        processId,
      },
      include: {
        processStep: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        identifiedBy: {
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
    });

    res.json({ painPoints });
  } catch (error) {
    console.error('Get pain points error:', error);
    res.status(500).json({ error: 'Failed to fetch pain points' });
  }
};

// Get a single pain point
export const getPainPoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const painPoint = await prisma.painPoint.findFirst({
      where: {
        id,
        process: {
          organizationId,
        },
      },
      include: {
        processStep: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        identifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!painPoint) {
      res.status(404).json({ error: 'Pain point not found' });
      return;
    }

    res.json({ painPoint });
  } catch (error) {
    console.error('Get pain point error:', error);
    res.status(500).json({ error: 'Failed to fetch pain point' });
  }
};

// Create a new pain point
export const createPainPoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { processId } = req.params;
    const validatedData = createPainPointSchema.parse(req.body);
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    // Verify process belongs to organization
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId,
      },
    });

    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    // If processStepId provided, verify it belongs to the process
    if (validatedData.processStepId) {
      const step = await prisma.processStep.findFirst({
        where: {
          id: validatedData.processStepId,
          processId,
        },
      });

      if (!step) {
        res.status(400).json({ error: 'Process step not found or does not belong to this process' });
        return;
      }
    }

    const painPoint = await prisma.painPoint.create({
      data: {
        ...validatedData,
        processId,
        identifiedById: userId,
      },
      include: {
        processStep: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        identifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Pain point created successfully',
      painPoint,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Create pain point error:', error);
    res.status(500).json({ error: 'Failed to create pain point' });
  }
};

// Update a pain point
export const updatePainPoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updatePainPointSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    // Verify pain point exists and belongs to organization
    const existingPainPoint = await prisma.painPoint.findFirst({
      where: {
        id,
        process: {
          organizationId,
        },
      },
    });

    if (!existingPainPoint) {
      res.status(404).json({ error: 'Pain point not found' });
      return;
    }

    const painPoint = await prisma.painPoint.update({
      where: { id },
      data: validatedData,
      include: {
        processStep: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        identifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Pain point updated successfully',
      painPoint,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Update pain point error:', error);
    res.status(500).json({ error: 'Failed to update pain point' });
  }
};

// Delete a pain point
export const deletePainPoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify pain point exists and belongs to organization
    const existingPainPoint = await prisma.painPoint.findFirst({
      where: {
        id,
        process: {
          organizationId,
        },
      },
    });

    if (!existingPainPoint) {
      res.status(404).json({ error: 'Pain point not found' });
      return;
    }

    await prisma.painPoint.delete({
      where: { id },
    });

    res.json({ message: 'Pain point deleted successfully' });
  } catch (error) {
    console.error('Delete pain point error:', error);
    res.status(500).json({ error: 'Failed to delete pain point' });
  }
};
