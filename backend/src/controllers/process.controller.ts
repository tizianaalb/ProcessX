import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';

// Validation schemas
const createProcessSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  type: z.enum(['AS_IS', 'TO_BE']).default('AS_IS'),
});

const updateProcessSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  type: z.enum(['AS_IS', 'TO_BE']).optional(),
});

const createProcessStepSchema = z.object({
  name: z.string().min(1, 'Step name is required').max(255),
  description: z.string().optional(),
  type: z.enum(['START', 'TASK', 'DECISION', 'END']).default('TASK'),
  duration: z.number().int().min(0).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  metadata: z.record(z.any()).optional(),
});

const createConnectionSchema = z.object({
  sourceStepId: z.string().uuid(),
  targetStepId: z.string().uuid(),
  label: z.string().optional(),
  type: z.enum(['DEFAULT', 'CONDITIONAL']).default('DEFAULT'),
});

// Get all processes for the user's organization
export const getProcesses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    const processes = await prisma.process.findMany({
      where: {
        organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            steps: true,
            painPoints: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({ processes });
  } catch (error) {
    console.error('Get processes error:', error);
    res.status(500).json({ error: 'Failed to fetch processes' });
  }
};

// Get a single process by ID
export const getProcess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const process = await prisma.process.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        steps: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        connections: true,
        painPoints: {
          include: {
            processStep: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    res.json({ process });
  } catch (error) {
    console.error('Get process error:', error);
    res.status(500).json({ error: 'Failed to fetch process' });
  }
};

// Create a new process
export const createProcess = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createProcessSchema.parse(req.body);
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    const process = await prisma.process.create({
      data: {
        ...validatedData,
        organizationId,
        createdById: userId,
        version: 1,
      },
      include: {
        createdBy: {
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
      message: 'Process created successfully',
      process,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Create process error:', error);
    res.status(500).json({ error: 'Failed to create process' });
  }
};

// Update a process
export const updateProcess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const validatedData = updateProcessSchema.parse(req.body);

    // Check if process exists and belongs to the organization
    const existingProcess = await prisma.process.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingProcess) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    const process = await prisma.process.update({
      where: { id },
      data: validatedData,
      include: {
        createdBy: {
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
      message: 'Process updated successfully',
      process,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Update process error:', error);
    res.status(500).json({ error: 'Failed to update process' });
  }
};

// Delete a process
export const deleteProcess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Check if process exists and belongs to the organization
    const existingProcess = await prisma.process.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingProcess) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    await prisma.process.delete({
      where: { id },
    });

    res.json({ message: 'Process deleted successfully' });
  } catch (error) {
    console.error('Delete process error:', error);
    res.status(500).json({ error: 'Failed to delete process' });
  }
};

// Add steps to a process
export const addProcessSteps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: processId } = req.params;
    const organizationId = req.user!.organizationId;
    const { steps } = req.body;

    if (!Array.isArray(steps)) {
      res.status(400).json({ error: 'Steps must be an array' });
      return;
    }

    // Validate all steps
    const validatedSteps = steps.map((step) => createProcessStepSchema.parse(step));

    // Check if process exists and belongs to the organization
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

    // Get current max order
    const maxOrder = await prisma.processStep.aggregate({
      where: { processId },
      _max: { order: true },
    });

    const startOrder = (maxOrder._max.order || 0) + 1;

    // Create all steps
    const createdSteps = await Promise.all(
      validatedSteps.map((step, index) => {
        const { position, ...stepData } = step;
        return prisma.processStep.create({
          data: {
            ...stepData,
            processId,
            order: startOrder + index,
            positionX: position.x,
            positionY: position.y,
          },
        });
      })
    );

    res.status(201).json({
      message: 'Process steps added successfully',
      steps: createdSteps,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Add process steps error:', error);
    res.status(500).json({ error: 'Failed to add process steps' });
  }
};

// Update existing process steps
export const updateProcessSteps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: processId } = req.params;
    const organizationId = req.user!.organizationId;
    const { steps } = req.body;

    if (!Array.isArray(steps)) {
      res.status(400).json({ error: 'Steps must be an array' });
      return;
    }

    // Check if process exists and belongs to the organization
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

    // Update all steps
    const updatedSteps = await Promise.all(
      steps.map(async (step: any) => {
        const { id, position, ...updateData } = step;

        // Verify step belongs to this process
        const existingStep = await prisma.processStep.findFirst({
          where: {
            id,
            processId,
          },
        });

        if (!existingStep) {
          throw new Error(`Step ${id} not found in this process`);
        }

        return prisma.processStep.update({
          where: { id },
          data: {
            ...updateData,
            positionX: position?.x ?? existingStep.positionX,
            positionY: position?.y ?? existingStep.positionY,
          },
        });
      })
    );

    res.json({
      message: 'Process steps updated successfully',
      steps: updatedSteps,
    });
  } catch (error) {
    console.error('Update process steps error:', error);
    res.status(500).json({ error: 'Failed to update process steps' });
  }
};

// Add connections between steps
export const addProcessConnections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: processId } = req.params;
    const organizationId = req.user!.organizationId;
    const { connections } = req.body;

    if (!Array.isArray(connections)) {
      res.status(400).json({ error: 'Connections must be an array' });
      return;
    }

    // Validate all connections
    const validatedConnections = connections.map((conn) =>
      createConnectionSchema.parse(conn)
    );

    // Check if process exists and belongs to the organization
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

    // Create all connections
    const createdConnections = await Promise.all(
      validatedConnections.map((conn) =>
        prisma.processConnection.create({
          data: {
            ...conn,
            processId,
          },
        })
      )
    );

    res.status(201).json({
      message: 'Process connections added successfully',
      connections: createdConnections,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Add process connections error:', error);
    res.status(500).json({ error: 'Failed to add process connections' });
  }
};
