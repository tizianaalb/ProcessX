import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import processReviewService from '../services/processReview.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/reviews
 * Request a new review for a process
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { processId, reviewerId, comments } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'processId is required' });
    }

    // Verify user has access to this process
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId: req.user!.organizationId,
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    // If reviewerId is provided, verify they're in the same organization
    if (reviewerId) {
      const reviewer = await prisma.user.findFirst({
        where: {
          id: reviewerId,
          organizationId: req.user!.organizationId,
        },
      });

      if (!reviewer) {
        return res.status(400).json({ error: 'Reviewer not found in organization' });
      }
    }

    const review = await processReviewService.requestReview({
      processId,
      requesterId: req.user!.userId,
      reviewerId,
      comments,
    });

    res.status(201).json(review);
  } catch (error: any) {
    console.error('Error creating review:', error);
    res.status(400).json({ error: error.message || 'Failed to create review' });
  }
});

/**
 * GET /api/reviews/pending
 * Get pending reviews for the current user
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const reviews = await processReviewService.getPendingReviewsForUser(
      req.user!.userId,
      req.user!.organizationId
    );
    res.json(reviews);
  } catch (error) {
    console.error('Error getting pending reviews:', error);
    res.status(500).json({ error: 'Failed to get pending reviews' });
  }
});

/**
 * GET /api/reviews/my-requests
 * Get reviews requested by the current user
 */
router.get('/my-requests', async (req: Request, res: Response) => {
  try {
    const reviews = await processReviewService.getReviewsRequestedByUser(req.user!.userId);
    res.json(reviews);
  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

/**
 * GET /api/reviews/stats
 * Get review statistics for the organization
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await processReviewService.getReviewStats(req.user!.organizationId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting review stats:', error);
    res.status(500).json({ error: 'Failed to get review statistics' });
  }
});

/**
 * GET /api/reviews/process/:processId
 * Get all reviews for a specific process
 */
router.get('/process/:processId', async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;

    // Verify user has access to this process
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId: req.user!.organizationId,
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    const reviews = await processReviewService.getProcessReviews(processId);
    res.json(reviews);
  } catch (error) {
    console.error('Error getting process reviews:', error);
    res.status(500).json({ error: 'Failed to get process reviews' });
  }
});

/**
 * GET /api/reviews/:id
 * Get a specific review
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const review = await processReviewService.getReview(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Verify user has access to this review's process
    const process = await prisma.process.findFirst({
      where: {
        id: review.processId,
        organizationId: req.user!.organizationId,
      },
    });

    if (!process) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error getting review:', error);
    res.status(500).json({ error: 'Failed to get review' });
  }
});

/**
 * PATCH /api/reviews/:id
 * Update a review (approve, reject, or request changes)
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { status, decision, comments } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    if (!['approved', 'rejected', 'changes_requested'].includes(status)) {
      return res.status(400).json({
        error: 'status must be one of: approved, rejected, changes_requested',
      });
    }

    const review = await processReviewService.updateReview({
      reviewId: req.params.id,
      reviewerId: req.user!.userId,
      status,
      decision,
      comments,
    });

    res.json(review);
  } catch (error: any) {
    console.error('Error updating review:', error);
    res.status(400).json({ error: error.message || 'Failed to update review' });
  }
});

/**
 * POST /api/reviews/:id/assign
 * Assign a reviewer to a pending review
 */
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { reviewerId } = req.body;

    if (!reviewerId) {
      return res.status(400).json({ error: 'reviewerId is required' });
    }

    // Verify reviewer is in the same organization
    const reviewer = await prisma.user.findFirst({
      where: {
        id: reviewerId,
        organizationId: req.user!.organizationId,
      },
    });

    if (!reviewer) {
      return res.status(400).json({ error: 'Reviewer not found in organization' });
    }

    const review = await processReviewService.assignReviewer(req.params.id, reviewerId);
    res.json(review);
  } catch (error: any) {
    console.error('Error assigning reviewer:', error);
    res.status(400).json({ error: error.message || 'Failed to assign reviewer' });
  }
});

/**
 * DELETE /api/reviews/:id
 * Cancel a pending review (only by requester)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await processReviewService.cancelReview(req.params.id, req.user!.userId);

    if (!success) {
      return res.status(404).json({ error: 'Review not found or cannot be cancelled' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling review:', error);
    res.status(500).json({ error: 'Failed to cancel review' });
  }
});

export default router;
