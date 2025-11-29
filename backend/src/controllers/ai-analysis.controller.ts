import { Request, Response } from 'express';
import { AIAnalysisService } from '../services/ai-analysis.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const aiAnalysisService = new AIAnalysisService();

/**
 * Start AI analysis for a process
 * POST /api/processes/:processId/analyze
 */
export const startAnalysis = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;
    const { analysisType = 'FULL' } = req.body;
    const user = (req as any).user;

    console.log('🔍 Starting AI analysis:', {
      processId,
      analysisType,
      userId: user.userId,
      organizationId: user.organizationId,
    });

    // Verify process exists and user has access
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId: user.organizationId,
      },
    });

    if (!process) {
      console.log('❌ Process not found:', processId);
      return res.status(404).json({
        success: false,
        message: 'Process not found',
      });
    }

    console.log('✅ Process found, starting analysis...');

    // Start analysis
    const analysisId = await aiAnalysisService.analyzeProcess(
      processId,
      user.userId,
      analysisType
    );

    console.log('✅ Analysis started successfully:', analysisId);

    res.json({
      success: true,
      message: 'Analysis started',
      analysisId,
    });
  } catch (error: any) {
    console.error('❌ Error starting analysis:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to start analysis',
      error: error.message,
    });
  }
};

/**
 * Get analysis result
 * GET /api/analyses/:analysisId
 */
export const getAnalysis = async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const user = (req as any).user;

    const analysis = await aiAnalysisService.getAnalysis(analysisId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found',
      });
    }

    // Verify user has access (same organization)
    const process = await prisma.process.findFirst({
      where: {
        id: analysis.processId,
        organizationId: user.organizationId,
      },
    });

    if (!process) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis',
      error: error.message,
    });
  }
};

/**
 * Get all analyses for a process
 * GET /api/processes/:processId/analyses
 */
export const getProcessAnalyses = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;
    const user = (req as any).user;

    // Verify process exists and user has access
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId: user.organizationId,
      },
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Process not found',
      });
    }

    const analyses = await aiAnalysisService.getProcessAnalyses(processId);

    res.json({
      success: true,
      analyses,
    });
  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analyses',
      error: error.message,
    });
  }
};

/**
 * Approve recommendation
 * POST /api/recommendations/:recommendationId/approve
 */
export const approveRecommendation = async (req: Request, res: Response) => {
  try {
    const { recommendationId } = req.params;
    const user = (req as any).user;

    // Verify recommendation exists and user has access
    const recommendation = await prisma.processRecommendation.findUnique({
      where: { id: recommendationId },
      include: {
        process: true,
      },
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found',
      });
    }

    if (recommendation.process.organizationId !== user.organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Update recommendation status
    const updated = await prisma.processRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: 'APPROVED',
        approvedById: user.userId,
        approvedAt: new Date(),
      },
    });

    res.json({
      success: true,
      recommendation: updated,
    });
  } catch (error: any) {
    console.error('Error approving recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve recommendation',
      error: error.message,
    });
  }
};

/**
 * Reject recommendation
 * POST /api/recommendations/:recommendationId/reject
 */
export const rejectRecommendation = async (req: Request, res: Response) => {
  try {
    const { recommendationId } = req.params;
    const user = (req as any).user;

    // Verify recommendation exists and user has access
    const recommendation = await prisma.processRecommendation.findUnique({
      where: { id: recommendationId },
      include: {
        process: true,
      },
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found',
      });
    }

    if (recommendation.process.organizationId !== user.organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Update recommendation status
    const updated = await prisma.processRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: 'REJECTED',
      },
    });

    res.json({
      success: true,
      recommendation: updated,
    });
  } catch (error: any) {
    console.error('Error rejecting recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject recommendation',
      error: error.message,
    });
  }
};

/**
 * Mark recommendation as implemented
 * POST /api/recommendations/:recommendationId/implement
 */
export const implementRecommendation = async (req: Request, res: Response) => {
  try {
    const { recommendationId } = req.params;
    const user = (req as any).user;

    // Verify recommendation exists and user has access
    const recommendation = await prisma.processRecommendation.findUnique({
      where: { id: recommendationId },
      include: {
        process: true,
      },
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found',
      });
    }

    if (recommendation.process.organizationId !== user.organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Update recommendation status
    const updated = await prisma.processRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: 'IMPLEMENTED',
        implementedAt: new Date(),
      },
    });

    res.json({
      success: true,
      recommendation: updated,
    });
  } catch (error: any) {
    console.error('Error implementing recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark recommendation as implemented',
      error: error.message,
    });
  }
};

/**
 * Delete an analysis
 * DELETE /api/analyses/:analysisId
 */
export const deleteAnalysis = async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const user = (req as any).user;

    // Verify analysis exists and user has access
    const analysis = await prisma.aIAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        process: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found',
      });
    }

    if (analysis.process.organizationId !== user.organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Delete related recommendations first (cascade should handle this, but being explicit)
    await prisma.processRecommendation.deleteMany({
      where: { analysisId },
    });

    // Delete the analysis
    await prisma.aIAnalysis.delete({
      where: { id: analysisId },
    });

    res.json({
      success: true,
      message: 'Analysis deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete analysis',
      error: error.message,
    });
  }
};

/**
 * Get recommendations for a process
 * GET /api/processes/:processId/recommendations
 */
export const getProcessRecommendations = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;
    const { status } = req.query;
    const user = (req as any).user;

    // Verify process exists and user has access
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId: user.organizationId,
      },
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Process not found',
      });
    }

    // Build filter
    const where: any = { processId };
    if (status) {
      where.status = status;
    }

    const recommendations = await prisma.processRecommendation.findMany({
      where,
      include: {
        analysis: {
          select: {
            id: true,
            analysisType: true,
            createdAt: true,
          },
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      recommendations,
    });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message,
    });
  }
};
