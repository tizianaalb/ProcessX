import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AIService } from '../services/ai.service';

/**
 * Analyze a process with AI and detect pain points
 */
export const analyzeProcess = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;
    const userId = (req as any).user.userId;

    // Fetch the process with all details
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organization: {
          users: {
            some: {
              id: userId,
            },
          },
        },
      },
      include: {
        steps: {
          orderBy: {
            order: 'asc',
          },
        },
        painPoints: {
          include: {
            processStep: true,
          },
        },
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    // Call AI service to analyze
    const analysis = await AIService.analyzePainPoints(
      process.organizationId,
      {
        name: process.name,
        description: process.description || undefined,
        steps: process.steps.map(step => ({
          id: step.id,
          name: step.name,
          description: step.description || undefined,
          duration: step.duration || undefined,
          type: step.type,
          responsibleRole: step.responsibleRole || undefined,
          requiredSystems: step.requiredSystems,
        })),
        existingPainPoints: process.painPoints.map(pp => ({
          category: pp.category,
          severity: pp.severity,
          title: pp.title,
          description: pp.description,
        })),
      }
    );

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Process analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze process',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Generate optimization recommendations for a process
 */
export const generateRecommendations = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;
    const userId = (req as any).user.userId;

    // Fetch the process
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organization: {
          users: {
            some: {
              id: userId,
            },
          },
        },
      },
      include: {
        painPoints: true,
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    if (process.painPoints.length === 0) {
      return res.status(400).json({
        error: 'No pain points found',
        message: 'Please identify pain points before generating recommendations',
      });
    }

    // Generate recommendations using AI
    const recommendations = await AIService.generateRecommendations(
      process.organizationId,
      {
        name: process.name,
        description: process.description || undefined,
        category: process.category || undefined,
      },
      process.painPoints.map(pp => ({
        category: pp.category,
        severity: pp.severity,
        title: pp.title,
        description: pp.description,
        impact: pp.impact || undefined,
      }))
    );

    // Save recommendations to database
    const savedRecommendations = await Promise.all(
      recommendations.map(rec =>
        prisma.recommendation.create({
          data: {
            processId: process.id,
            category: rec.category,
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            expectedBenefits: rec.expectedBenefits,
            implementationEffort: rec.implementation.effort,
            estimatedTimeline: rec.implementation.timeline,
            implementationSteps: rec.implementation.steps,
            estimatedImpact: JSON.stringify(rec.metrics),
            status: 'PENDING',
          },
        })
      )
    );

    res.json({
      success: true,
      recommendations: savedRecommendations,
    });
  } catch (error) {
    console.error('Recommendation generation error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all recommendations for a process
 */
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;
    const userId = (req as any).user.userId;

    // Verify access
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organization: {
          users: {
            some: {
              id: userId,
            },
          },
        },
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    const recommendations = await prisma.recommendation.findMany({
      where: {
        processId,
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to retrieve recommendations' });
  }
};

/**
 * Update recommendation status
 */
export const updateRecommendationStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { recommendationId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.userId;

    // Verify access
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id: recommendationId,
        process: {
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
      },
    });

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const updated = await prisma.recommendation.update({
      where: {
        id: recommendationId,
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      recommendation: updated,
    });
  } catch (error) {
    console.error('Update recommendation error:', error);
    res.status(500).json({ error: 'Failed to update recommendation' });
  }
};

/**
 * Generate a target (TO_BE) process based on recommendations
 */
export const generateTargetProcess = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;
    const userId = (req as any).user.userId;

    // Fetch source process
    const sourceProcess = await prisma.process.findFirst({
      where: {
        id: processId,
        organization: {
          users: {
            some: {
              id: userId,
            },
          },
        },
      },
      include: {
        steps: {
          orderBy: {
            order: 'asc',
          },
        },
        recommendations: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED'],
            },
          },
        },
        organization: true,
      },
    });

    if (!sourceProcess) {
      return res.status(404).json({ error: 'Process not found' });
    }

    if (sourceProcess.recommendations.length === 0) {
      return res.status(400).json({
        error: 'No recommendations found',
        message: 'Please generate recommendations before creating target process',
      });
    }

    // Generate target process using AI
    const targetProcessData = await AIService.generateTargetProcess(
      sourceProcess.organizationId,
      {
        name: sourceProcess.name,
        description: sourceProcess.description || undefined,
        steps: sourceProcess.steps.map(step => ({
          name: step.name,
          description: step.description || undefined,
          type: step.type,
          duration: step.duration || undefined,
        })),
      },
      sourceProcess.recommendations.map(rec => ({
        title: rec.title,
        description: rec.description,
        category: rec.category,
      }))
    );

    // Create new target process
    const targetProcess = await prisma.targetProcess.create({
      data: {
        processId: sourceProcess.id,
        createdById: userId,
        name: targetProcessData.name,
        description: targetProcessData.description,
        targetSteps: JSON.stringify(targetProcessData.steps),
        expectedImprovements: targetProcessData.expectedImprovements,
        implementationPlan: targetProcessData.summary,
        status: 'PROPOSED',
      },
    });

    res.json({
      success: true,
      targetProcess,
      details: targetProcessData,
    });
  } catch (error) {
    console.error('Target process generation error:', error);
    res.status(500).json({
      error: 'Failed to generate target process',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get target processes for a source process
 */
export const getTargetProcesses = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;
    const userId = (req as any).user.userId;

    // Verify access
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organization: {
          users: {
            some: {
              id: userId,
            },
          },
        },
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    const targetProcesses = await prisma.targetProcess.findMany({
      where: {
        processId,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      targetProcesses,
    });
  } catch (error) {
    console.error('Get target processes error:', error);
    res.status(500).json({ error: 'Failed to retrieve target processes' });
  }
};
