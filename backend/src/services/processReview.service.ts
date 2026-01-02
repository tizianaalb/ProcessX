import { PrismaClient } from '@prisma/client';
import notificationService from './notification.service.js';

const prisma = new PrismaClient();

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface CreateReviewRequest {
  processId: string;
  requesterId: string;
  reviewerId?: string;
  comments?: string;
}

export interface UpdateReviewRequest {
  reviewId: string;
  reviewerId: string;
  status: ReviewStatus;
  decision?: string;
  comments?: string;
}

export interface ReviewWithDetails {
  id: string;
  processId: string;
  requesterId: string;
  reviewerId: string | null;
  status: string;
  comments: string | null;
  decision: string | null;
  requestedAt: Date;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  process?: {
    id: string;
    name: string;
    status: string;
  };
  requester?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  reviewer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export class ProcessReviewService {
  /**
   * Request a review for a process
   */
  async requestReview(input: CreateReviewRequest): Promise<ReviewWithDetails> {
    // Check if there's already a pending review
    const existingReview = await prisma.processReview.findFirst({
      where: {
        processId: input.processId,
        status: 'pending',
      },
    });

    if (existingReview) {
      throw new Error('A review is already pending for this process');
    }

    const review = await prisma.processReview.create({
      data: {
        processId: input.processId,
        requesterId: input.requesterId,
        reviewerId: input.reviewerId,
        status: 'pending',
        comments: input.comments,
      },
      include: {
        process: {
          select: { id: true, name: true, status: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Send notification to reviewer if assigned
    if (input.reviewerId) {
      const requesterName = review.requester
        ? `${review.requester.firstName || ''} ${review.requester.lastName || ''}`.trim() ||
          review.requester.email
        : 'Someone';

      await notificationService.notifyReviewRequest(
        input.reviewerId,
        requesterName,
        review.process.name,
        review.processId,
        review.id
      );
    }

    return review;
  }

  /**
   * Update a review (approve, reject, or request changes)
   */
  async updateReview(input: UpdateReviewRequest): Promise<ReviewWithDetails> {
    const review = await prisma.processReview.findUnique({
      where: { id: input.reviewId },
      include: {
        process: { select: { id: true, name: true, status: true, organizationId: true } },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.status !== 'pending') {
      throw new Error('Review has already been completed');
    }

    // Verify the reviewer has permission (if reviewerId was set)
    if (review.reviewerId && review.reviewerId !== input.reviewerId) {
      throw new Error('You are not assigned to review this process');
    }

    const updatedReview = await prisma.processReview.update({
      where: { id: input.reviewId },
      data: {
        reviewerId: input.reviewerId,
        status: input.status,
        decision: input.decision,
        comments: input.comments,
        reviewedAt: new Date(),
      },
      include: {
        process: { select: { id: true, name: true, status: true } },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Get reviewer name for notification
    const reviewerName = updatedReview.reviewer
      ? `${updatedReview.reviewer.firstName || ''} ${updatedReview.reviewer.lastName || ''}`.trim() ||
        updatedReview.reviewer.email
      : 'A reviewer';

    // Send notification to requester
    if (input.status === 'approved') {
      await notificationService.notifyApproval(
        review.requesterId,
        reviewerName,
        review.process.name,
        review.processId
      );

      // Update process status to ACTIVE if approved
      await prisma.process.update({
        where: { id: review.processId },
        data: { status: 'ACTIVE' },
      });
    } else if (input.status === 'rejected' || input.status === 'changes_requested') {
      await notificationService.notifyRejection(
        review.requesterId,
        reviewerName,
        review.process.name,
        review.processId,
        input.comments
      );
    }

    return updatedReview;
  }

  /**
   * Get review by ID
   */
  async getReview(reviewId: string): Promise<ReviewWithDetails | null> {
    return prisma.processReview.findUnique({
      where: { id: reviewId },
      include: {
        process: { select: { id: true, name: true, status: true } },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Get reviews for a process
   */
  async getProcessReviews(processId: string): Promise<ReviewWithDetails[]> {
    return prisma.processReview.findMany({
      where: { processId },
      orderBy: { createdAt: 'desc' },
      include: {
        process: { select: { id: true, name: true, status: true } },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Get pending reviews for a user (reviews they need to complete)
   */
  async getPendingReviewsForUser(userId: string, organizationId: string): Promise<ReviewWithDetails[]> {
    return prisma.processReview.findMany({
      where: {
        status: 'pending',
        process: { organizationId },
        OR: [
          { reviewerId: userId },
          { reviewerId: null }, // Unassigned reviews can be taken by anyone
        ],
      },
      orderBy: { requestedAt: 'asc' },
      include: {
        process: { select: { id: true, name: true, status: true } },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Get reviews requested by a user
   */
  async getReviewsRequestedByUser(userId: string): Promise<ReviewWithDetails[]> {
    return prisma.processReview.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        process: { select: { id: true, name: true, status: true } },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Assign a reviewer to a pending review
   */
  async assignReviewer(reviewId: string, reviewerId: string): Promise<ReviewWithDetails> {
    const review = await prisma.processReview.findUnique({
      where: { id: reviewId },
      include: {
        process: { select: { name: true } },
        requester: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.status !== 'pending') {
      throw new Error('Can only assign reviewer to pending reviews');
    }

    const updatedReview = await prisma.processReview.update({
      where: { id: reviewId },
      data: { reviewerId },
      include: {
        process: { select: { id: true, name: true, status: true } },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Notify the assigned reviewer
    const requesterName = review.requester
      ? `${review.requester.firstName || ''} ${review.requester.lastName || ''}`.trim() ||
        review.requester.email
      : 'Someone';

    await notificationService.notifyReviewRequest(
      reviewerId,
      requesterName,
      review.process.name,
      review.processId,
      review.id
    );

    return updatedReview;
  }

  /**
   * Cancel a pending review
   */
  async cancelReview(reviewId: string, requesterId: string): Promise<boolean> {
    const review = await prisma.processReview.findFirst({
      where: {
        id: reviewId,
        requesterId,
        status: 'pending',
      },
    });

    if (!review) {
      return false;
    }

    await prisma.processReview.delete({
      where: { id: reviewId },
    });

    return true;
  }

  /**
   * Get review statistics for an organization
   */
  async getReviewStats(organizationId: string): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    changesRequested: number;
    avgReviewTime: number | null;
  }> {
    const stats = await prisma.processReview.groupBy({
      by: ['status'],
      where: {
        process: { organizationId },
      },
      _count: { id: true },
    });

    // Calculate average review time
    const completedReviews = await prisma.processReview.findMany({
      where: {
        process: { organizationId },
        reviewedAt: { not: null },
      },
      select: {
        requestedAt: true,
        reviewedAt: true,
      },
    });

    let avgReviewTime: number | null = null;
    if (completedReviews.length > 0) {
      const totalTime = completedReviews.reduce((sum, review) => {
        if (review.reviewedAt) {
          return sum + (review.reviewedAt.getTime() - review.requestedAt.getTime());
        }
        return sum;
      }, 0);
      avgReviewTime = Math.round(totalTime / completedReviews.length / (1000 * 60 * 60)); // Hours
    }

    return {
      pending: stats.find((s) => s.status === 'pending')?._count.id || 0,
      approved: stats.find((s) => s.status === 'approved')?._count.id || 0,
      rejected: stats.find((s) => s.status === 'rejected')?._count.id || 0,
      changesRequested: stats.find((s) => s.status === 'changes_requested')?._count.id || 0,
      avgReviewTime,
    };
  }
}

export default new ProcessReviewService();
