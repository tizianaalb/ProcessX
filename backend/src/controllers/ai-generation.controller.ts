import { Request, Response } from 'express';
import { z } from 'zod';
import { AIService } from '../services/ai.service.js';
import { prisma } from '../services/prisma.js';

// Validation schema for process generation request
const generateProcessSchema = z.object({
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000),
  processType: z.enum(['AS_IS', 'TO_BE']).default('AS_IS'),
  industryContext: z.string().default('insurance'),
  createImmediately: z.boolean().default(false),
});

/**
 * Generate a process from a natural language description using AI
 */
export const generateProcessFromDescription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData = generateProcessSchema.parse(req.body);
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    console.log(`🤖 Generating process from description for user ${userId}...`);
    console.log(`📝 Description: ${validatedData.description.substring(0, 100)}...`);

    // Call AI service to generate the process structure
    const generatedProcess = await AIService.generateProcessFromDescription(
      organizationId,
      validatedData.description,
      validatedData.processType,
      validatedData.industryContext
    );

    console.log(`✅ AI generated process: ${generatedProcess.name}`);
    console.log(`📊 Generated ${generatedProcess.steps.length} steps and ${generatedProcess.connections.length} connections`);

    // If createImmediately is true, save the process to the database
    if (validatedData.createImmediately) {
      const createdProcess = await prisma.process.create({
        data: {
          name: generatedProcess.name,
          description: generatedProcess.description,
          type: validatedData.processType,
          organizationId,
          createdById: userId,
          version: 1,
          status: 'DRAFT',
        },
      });

      // Create all steps
      const stepIdMap = new Map<string, string>(); // Map temp IDs to real DB IDs

      for (const step of generatedProcess.steps) {
        const createdStep = await prisma.processStep.create({
          data: {
            processId: createdProcess.id,
            name: step.name,
            description: step.description,
            type: step.type,
            duration: step.duration || null,
            positionX: step.position.x,
            positionY: step.position.y,
            order: generatedProcess.steps.indexOf(step),
            metadata: step.metadata || {},
          },
        });
        stepIdMap.set(step.id, createdStep.id);
      }

      // Create all connections using the mapped IDs
      for (const connection of generatedProcess.connections) {
        const sourceId = stepIdMap.get(connection.sourceStepId);
        const targetId = stepIdMap.get(connection.targetStepId);

        if (sourceId && targetId) {
          await prisma.processConnection.create({
            data: {
              processId: createdProcess.id,
              sourceStepId: sourceId,
              targetStepId: targetId,
              label: connection.label || null,
              type: connection.type,
            },
          });
        }
      }

      // Fetch the complete created process
      const completeProcess = await prisma.process.findUnique({
        where: { id: createdProcess.id },
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
        message: 'Process generated and created successfully',
        process: completeProcess,
        aiGenerated: true,
      });
    } else {
      // Return the generated structure for preview
      res.status(200).json({
        success: true,
        message: 'Process generated successfully',
        preview: generatedProcess,
        aiGenerated: true,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Generate process error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate process',
    });
  }
};
