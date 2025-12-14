import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';

// Validation schema for creating a template
const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  industrySector: z.string().default('insurance'),
  templateData: z.object({
    steps: z.array(z.any()),
    connections: z.array(z.any()),
  }),
  previewImageUrl: z.string().optional(),
  isPublic: z.boolean().default(true),
});

// Validation schema for updating a template
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  templateData: z.object({
    steps: z.array(z.any()),
    connections: z.array(z.any()),
  }).optional(),
  previewImageUrl: z.string().optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Get all templates (public + organization-specific)
 */
export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { category, industrySector } = req.query;

    const where: any = {
      OR: [
        { isPublic: true },
        { organizationId },
      ],
    };

    if (category) {
      where.category = category;
    }

    if (industrySector) {
      where.industrySector = industrySector;
    }

    const templates = await prisma.processTemplate.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
    });
  }
};

/**
 * Get a single template by ID
 */
export const getTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const template = await prisma.processTemplate.findFirst({
      where: {
        id,
        OR: [
          { isPublic: true },
          { organizationId },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
    });
  }
};

/**
 * Create a new template (admin/organization-specific)
 */
export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createTemplateSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const template = await prisma.processTemplate.create({
      data: {
        ...validatedData,
        organizationId: validatedData.isPublic ? null : organizationId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
    });
  }
};

/**
 * Update a template
 */
export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const validatedData = updateTemplateSchema.parse(req.body);

    // Check if template exists and user has permission
    const existingTemplate = await prisma.processTemplate.findFirst({
      where: {
        id,
        organizationId, // Only allow updating own organization's templates
      },
    });

    if (!existingTemplate) {
      res.status(404).json({
        success: false,
        error: 'Template not found or you do not have permission to update it',
      });
      return;
    }

    const template = await prisma.processTemplate.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      template,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
    });
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Check if template exists and user has permission
    const existingTemplate = await prisma.processTemplate.findFirst({
      where: {
        id,
        organizationId, // Only allow deleting own organization's templates
      },
    });

    if (!existingTemplate) {
      res.status(404).json({
        success: false,
        error: 'Template not found or you do not have permission to delete it',
      });
      return;
    }

    await prisma.processTemplate.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
    });
  }
};

/**
 * Create a process from a template
 */
export const useTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: templateId } = req.params;
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;
    const { name, description } = req.body;

    // Get the template
    const template = await prisma.processTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { isPublic: true },
          { organizationId },
        ],
      },
    });

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    // Extract template data
    const templateData = template.templateData as any;

    // Create the process
    const process = await prisma.process.create({
      data: {
        name: name || template.name,
        description: description || template.description || '',
        type: 'AS_IS',
        organizationId,
        createdById: userId,
        version: 1,
        status: 'DRAFT',
        category: template.category || null,
      },
    });

    // Analyze template layout and prepare position transformation
    const positions = templateData.steps.map((s: any) => ({
      x: s.position?.x || s.positionX || 0,
      y: s.position?.y || s.positionY || 0,
    }));

    const xPositions = positions.map(p => p.x);
    const yPositions = positions.map(p => p.y);
    const xRange = Math.max(...xPositions) - Math.min(...xPositions);
    const yRange = Math.max(...yPositions) - Math.min(...yPositions);

    // If layout is horizontal (xRange > yRange), transform to vertical
    const isHorizontal = xRange > yRange;

    // Function to transform positions from horizontal to vertical layout
    const transformPosition = (originalX: number, originalY: number) => {
      if (!isHorizontal) {
        // Already vertical, keep as-is
        return { x: originalX, y: originalY };
      }

      // Transform horizontal to vertical:
      // - Use original x-position for new y-position (main flow goes down)
      // - Use original y-position for new x-position (branches spread horizontally)
      // - Scale y-position to be more spread out vertically
      const newX = originalY;
      const newY = originalX;

      return { x: newX, y: newY };
    };

    // Create steps with ID mapping
    const stepIdMap = new Map<string, string>();

    for (const step of templateData.steps) {
      const originalX = step.position?.x || step.positionX || 0;
      const originalY = step.position?.y || step.positionY || 0;
      const { x, y } = transformPosition(originalX, originalY);

      const createdStep = await prisma.processStep.create({
        data: {
          processId: process.id,
          name: step.name,
          description: step.description || '',
          type: step.type,
          duration: step.duration || null,
          positionX: x,
          positionY: y,
          order: templateData.steps.indexOf(step),
          metadata: step.metadata || {},
        },
      });
      stepIdMap.set(step.id, createdStep.id);
    }

    // Create connections
    for (const connection of templateData.connections) {
      const sourceId = stepIdMap.get(connection.sourceStepId);
      const targetId = stepIdMap.get(connection.targetStepId);

      if (sourceId && targetId) {
        await prisma.processConnection.create({
          data: {
            processId: process.id,
            sourceStepId: sourceId,
            targetStepId: targetId,
            label: connection.label || null,
            type: connection.type || 'DEFAULT',
          },
        });
      }
    }

    // Increment usage count
    await prisma.processTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    // Fetch complete process
    const completeProcess = await prisma.process.findUnique({
      where: { id: process.id },
      include: {
        steps: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        connections: true,
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
      success: true,
      message: 'Process created from template successfully',
      process: completeProcess,
    });
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create process from template',
    });
  }
};
