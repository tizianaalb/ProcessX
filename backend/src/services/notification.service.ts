import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type NotificationType = 'mention' | 'review_request' | 'approval' | 'rejection' | 'comment' | 'system';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
}

export interface NotificationWithUser {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(input: CreateNotificationInput): Promise<NotificationWithUser> {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        link: input.link,
      },
    });
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    notification: Omit<CreateNotificationInput, 'userId'>
  ): Promise<number> {
    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        link: notification.link,
      })),
    });
    return result.count;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: NotificationWithUser[]; total: number; unreadCount: number }> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    const where = {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationWithUser | null> {
    // Verify ownership
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return null;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    // Verify ownership
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return false;
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return true;
  }

  /**
   * Delete old notifications (older than specified days)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true, // Only delete read notifications
      },
    });

    return result.count;
  }

  // ============ Notification Helpers for Common Events ============

  /**
   * Notify user about a review request
   */
  async notifyReviewRequest(
    reviewerId: string,
    requesterName: string,
    processName: string,
    processId: string,
    reviewId: string
  ): Promise<NotificationWithUser> {
    return this.createNotification({
      userId: reviewerId,
      type: 'review_request',
      title: 'Review Request',
      content: `${requesterName} requested your review for "${processName}"`,
      link: `/processes/${processId}?review=${reviewId}`,
    });
  }

  /**
   * Notify user about process approval
   */
  async notifyApproval(
    requesterId: string,
    reviewerName: string,
    processName: string,
    processId: string
  ): Promise<NotificationWithUser> {
    return this.createNotification({
      userId: requesterId,
      type: 'approval',
      title: 'Process Approved',
      content: `${reviewerName} approved "${processName}"`,
      link: `/processes/${processId}`,
    });
  }

  /**
   * Notify user about process rejection
   */
  async notifyRejection(
    requesterId: string,
    reviewerName: string,
    processName: string,
    processId: string,
    reason?: string
  ): Promise<NotificationWithUser> {
    return this.createNotification({
      userId: requesterId,
      type: 'rejection',
      title: 'Process Needs Revision',
      content: reason
        ? `${reviewerName} requested changes for "${processName}": ${reason}`
        : `${reviewerName} requested changes for "${processName}"`,
      link: `/processes/${processId}`,
    });
  }

  /**
   * Notify user about a mention
   */
  async notifyMention(
    mentionedUserId: string,
    mentionerName: string,
    context: string,
    link: string
  ): Promise<NotificationWithUser> {
    return this.createNotification({
      userId: mentionedUserId,
      type: 'mention',
      title: 'You were mentioned',
      content: `${mentionerName} mentioned you in ${context}`,
      link,
    });
  }

  /**
   * Parse @mentions from text and create notifications
   */
  async processMentions(
    text: string,
    mentionerUserId: string,
    context: string,
    link: string,
    organizationId: string
  ): Promise<number> {
    // Find @mentions in text (e.g., @john.doe or @"John Doe")
    const mentionPattern = /@"([^"]+)"|@(\S+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionPattern.exec(text)) !== null) {
      mentions.push(match[1] || match[2]);
    }

    if (mentions.length === 0) {
      return 0;
    }

    // Get mentioner info
    const mentioner = await prisma.user.findUnique({
      where: { id: mentionerUserId },
      select: { firstName: true, lastName: true, email: true },
    });

    const mentionerName = mentioner
      ? `${mentioner.firstName || ''} ${mentioner.lastName || ''}`.trim() || mentioner.email
      : 'Someone';

    // Find mentioned users
    const mentionedUsers = await prisma.user.findMany({
      where: {
        organizationId,
        OR: mentions.map((mention) => ({
          OR: [
            { email: { contains: mention, mode: 'insensitive' } },
            { firstName: { contains: mention, mode: 'insensitive' } },
            { lastName: { contains: mention, mode: 'insensitive' } },
          ],
        })),
      },
      select: { id: true },
    });

    // Create notifications for mentioned users (excluding the mentioner)
    const usersToNotify = mentionedUsers
      .filter((u) => u.id !== mentionerUserId)
      .map((u) => u.id);

    if (usersToNotify.length === 0) {
      return 0;
    }

    return this.createBulkNotifications(usersToNotify, {
      type: 'mention',
      title: 'You were mentioned',
      content: `${mentionerName} mentioned you in ${context}`,
      link,
    });
  }

  /**
   * Send system notification to all users in an organization
   */
  async notifyOrganization(
    organizationId: string,
    title: string,
    content: string,
    link?: string
  ): Promise<number> {
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true },
    });

    return this.createBulkNotifications(
      users.map((u) => u.id),
      {
        type: 'system',
        title,
        content,
        link,
      }
    );
  }
}

export default new NotificationService();
