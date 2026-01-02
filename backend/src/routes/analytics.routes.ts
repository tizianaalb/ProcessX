import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import processHealthService from '../services/processHealth.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/health/organization
 * Get organization-wide health summary
 */
router.get('/health/organization', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;
    const summary = await processHealthService.getOrganizationHealthSummary(organizationId);
    res.json(summary);
  } catch (error) {
    console.error('Error getting organization health summary:', error);
    res.status(500).json({ error: 'Failed to get organization health summary' });
  }
});

/**
 * GET /api/analytics/health/processes/:id
 * Get health score for a specific process
 */
router.get('/health/processes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { recalculate } = req.query;

    // Verify user has access to this process
    const process = await prisma.process.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    let result;
    if (recalculate === 'true') {
      result = await processHealthService.calculateHealthScore(id);
    } else {
      result = await processHealthService.getLatestHealthScore(id);
      if (!result) {
        // No existing score, calculate one
        result = await processHealthService.calculateHealthScore(id);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting process health:', error);
    res.status(500).json({ error: 'Failed to get process health score' });
  }
});

/**
 * POST /api/analytics/health/processes/:id/calculate
 * Force recalculate health score for a process
 */
router.post('/health/processes/:id/calculate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify user has access to this process
    const process = await prisma.process.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    const result = await processHealthService.calculateHealthScore(id);
    res.json(result);
  } catch (error) {
    console.error('Error calculating process health:', error);
    res.status(500).json({ error: 'Failed to calculate process health score' });
  }
});

/**
 * GET /api/analytics/health/processes/:id/history
 * Get health score history for a process
 */
router.get('/health/processes/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;

    // Verify user has access to this process
    const process = await prisma.process.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    const history = await processHealthService.getHealthHistory(id, limit);
    res.json(history);
  } catch (error) {
    console.error('Error getting process health history:', error);
    res.status(500).json({ error: 'Failed to get process health history' });
  }
});

/**
 * GET /api/analytics/summary
 * Get overall analytics summary for the organization
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    // Get process counts
    const processStats = await prisma.process.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
    });

    const totalProcesses = processStats.reduce((sum, s) => sum + s._count.id, 0);
    const activeProcesses = processStats.find((s) => s.status === 'ACTIVE')?._count.id || 0;
    const draftProcesses = processStats.find((s) => s.status === 'DRAFT')?._count.id || 0;

    // Get pain point counts
    const painPointStats = await prisma.painPoint.groupBy({
      by: ['status', 'severity'],
      where: {
        process: { organizationId },
      },
      _count: { id: true },
    });

    const openPainPoints = painPointStats
      .filter((s) => s.status === 'OPEN')
      .reduce((sum, s) => sum + s._count.id, 0);

    const criticalPainPoints = painPointStats
      .filter((s) => s.status === 'OPEN' && s.severity === 'CRITICAL')
      .reduce((sum, s) => sum + s._count.id, 0);

    // Get recommendation counts
    const recommendationStats = await prisma.processRecommendation.groupBy({
      by: ['status'],
      where: {
        process: { organizationId },
      },
      _count: { id: true },
    });

    const pendingRecommendations =
      recommendationStats.find((s) => s.status === 'PENDING')?._count.id || 0;
    const implementedRecommendations =
      recommendationStats.find((s) => s.status === 'IMPLEMENTED')?._count.id || 0;

    // Get health summary
    const healthSummary = await processHealthService.getOrganizationHealthSummary(organizationId);

    // Get recent activity
    const recentProcesses = await prisma.process.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    res.json({
      processes: {
        total: totalProcesses,
        active: activeProcesses,
        draft: draftProcesses,
      },
      painPoints: {
        open: openPainPoints,
        critical: criticalPainPoints,
      },
      recommendations: {
        pending: pendingRecommendations,
        implemented: implementedRecommendations,
      },
      health: healthSummary,
      recentActivity: recentProcesses,
    });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

/**
 * GET /api/analytics/trends
 * Get trend data over time
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get health metrics trend
    const healthTrend = await prisma.processHealthMetric.findMany({
      where: {
        process: { organizationId },
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        score: true,
        createdAt: true,
        process: {
          select: { name: true },
        },
      },
    });

    // Group by date
    const dailyAverages: Record<string, { scores: number[]; date: string }> = {};
    healthTrend.forEach((metric) => {
      const dateKey = metric.createdAt.toISOString().split('T')[0];
      if (!dailyAverages[dateKey]) {
        dailyAverages[dateKey] = { scores: [], date: dateKey };
      }
      dailyAverages[dateKey].scores.push(metric.score);
    });

    const trendData = Object.values(dailyAverages).map((day) => ({
      date: day.date,
      averageScore: Math.round(
        day.scores.reduce((a, b) => a + b, 0) / day.scores.length
      ),
      count: day.scores.length,
    }));

    // Get process creation trend
    const processCreationTrend = await prisma.process.groupBy({
      by: ['createdAt'],
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    });

    // Get pain points resolved trend
    const painPointsResolved = await prisma.painPoint.findMany({
      where: {
        process: { organizationId },
        status: 'RESOLVED',
        updatedAt: { gte: startDate },
      },
      select: {
        updatedAt: true,
      },
    });

    res.json({
      healthTrend: trendData,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Error getting analytics trends:', error);
    res.status(500).json({ error: 'Failed to get analytics trends' });
  }
});

export default router;
