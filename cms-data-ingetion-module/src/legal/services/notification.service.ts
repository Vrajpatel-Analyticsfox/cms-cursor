import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, sql, desc, gte } from 'drizzle-orm';
import * as schema from '../../db/schema';

export interface Notification {
  id: string;
  recipientId: string;
  recipientType: 'lawyer' | 'admin' | 'user';
  title: string;
  message: string;
  notificationType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface NotificationTemplate {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  variables: string[];
}

@Injectable()
export class NotificationService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  private readonly templates: NotificationTemplate[] = [
    {
      type: 'lawyer_assigned',
      title: 'New Case Assignment',
      message: 'You have been assigned to case {{caseCode}} for {{borrowerName}}',
      priority: 'high',
      variables: ['caseCode', 'borrowerName'],
    },
    {
      type: 'case_reassigned',
      title: 'Case Reassignment',
      message: 'Case {{caseCode}} has been reassigned to you',
      priority: 'high',
      variables: ['caseCode'],
    },
    {
      type: 'status_change',
      title: 'Case Status Update',
      message: 'Case {{caseCode}} status changed to {{newStatus}}',
      priority: 'medium',
      variables: ['caseCode', 'newStatus'],
    },
    {
      type: 'hearing_scheduled',
      title: 'Hearing Scheduled',
      message: 'Hearing scheduled for case {{caseCode}} on {{hearingDate}}',
      priority: 'high',
      variables: ['caseCode', 'hearingDate'],
    },
    {
      type: 'document_uploaded',
      title: 'New Document',
      message: 'New document "{{documentName}}" uploaded for case {{caseCode}}',
      priority: 'medium',
      variables: ['documentName', 'caseCode'],
    },
    {
      type: 'case_overdue',
      title: 'Overdue Case',
      message: 'Case {{caseCode}} is overdue and requires attention',
      priority: 'urgent',
      variables: ['caseCode'],
    },
    {
      type: 'workload_warning',
      title: 'Workload Warning',
      message: 'You are approaching your maximum case capacity ({{currentCases}}/{{maxCases}})',
      priority: 'medium',
      variables: ['currentCases', 'maxCases'],
    },
  ];

  /**
   * Send notification to a specific recipient
   */
  async sendNotification(notificationData: {
    recipientId: string;
    recipientType: 'lawyer' | 'admin' | 'user';
    notificationType: string;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    relatedEntityType?: string;
    relatedEntityId?: string;
    actionUrl?: string;
    expiresAt?: Date;
  }): Promise<{ success: boolean; message: string; notificationId?: string }> {
    try {
      const notification = await this.db
        .insert(schema.notifications)
        .values({
          recipientId: notificationData.recipientId,
          recipientType: notificationData.recipientType,
          title: notificationData.title,
          message: notificationData.message,
          notificationType: notificationData.notificationType,
          priority: notificationData.priority || 'medium',
          relatedEntityType: notificationData.relatedEntityType,
          relatedEntityId: notificationData.relatedEntityId,
          actionUrl: notificationData.actionUrl,
          expiresAt: notificationData.expiresAt,
          isRead: false,
          createdBy: 'system',
        })
        .returning();

      return {
        success: true,
        message: 'Notification sent successfully',
        notificationId: notification[0].id,
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, message: 'Failed to send notification' };
    }
  }

  /**
   * Send notification using template
   */
  async sendTemplateNotification(
    templateType: string,
    recipientId: string,
    recipientType: 'lawyer' | 'admin' | 'user',
    variables: Record<string, string>,
    relatedEntityType?: string,
    relatedEntityId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const template = this.templates.find((t) => t.type === templateType);
    if (!template) {
      return { success: false, message: 'Notification template not found' };
    }

    // Replace variables in template
    let title = template.title;
    let message = template.message;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), value);
      message = message.replace(new RegExp(placeholder, 'g'), value);
    }

    return await this.sendNotification({
      recipientId,
      recipientType,
      notificationType: templateType,
      title,
      message,
      priority: template.priority,
      relatedEntityType,
      relatedEntityId,
    });
  }

  /**
   * Notify lawyer assignment
   */
  async notifyLawyerAssignment(
    lawyerId: string,
    caseId: string,
    caseCode: string,
    borrowerName: string,
  ): Promise<void> {
    await this.sendTemplateNotification(
      'lawyer_assigned',
      lawyerId,
      'lawyer',
      {
        caseCode,
        borrowerName,
      },
      'Legal Case',
      caseId,
    );
  }

  /**
   * Notify case reassignment
   */
  async notifyCaseReassignment(
    lawyerId: string,
    caseId: string,
    caseCode: string,
    reason: string,
  ): Promise<void> {
    await this.sendTemplateNotification(
      'case_reassigned',
      lawyerId,
      'lawyer',
      {
        caseCode,
        reason,
      },
      'Legal Case',
      caseId,
    );
  }

  /**
   * Notify status change
   */
  async notifyStatusChange(
    caseId: string,
    caseCode: string,
    newStatus: string,
    recipientIds: string[],
    recipientType: 'lawyer' | 'admin' | 'user' = 'lawyer',
  ): Promise<void> {
    for (const recipientId of recipientIds) {
      await this.sendTemplateNotification(
        'status_change',
        recipientId,
        recipientType,
        {
          caseCode,
          newStatus,
        },
        'Legal Case',
        caseId,
      );
    }
  }

  /**
   * Notify hearing scheduled
   */
  async notifyHearingScheduled(
    caseId: string,
    caseCode: string,
    hearingDate: string,
    recipientIds: string[],
  ): Promise<void> {
    for (const recipientId of recipientIds) {
      await this.sendTemplateNotification(
        'hearing_scheduled',
        recipientId,
        'lawyer',
        {
          caseCode,
          hearingDate,
        },
        'Legal Case',
        caseId,
      );
    }
  }

  /**
   * Notify document upload
   */
  async notifyDocumentUpload(
    caseId: string,
    caseCode: string,
    documentName: string,
    recipientIds: string[],
  ): Promise<void> {
    for (const recipientId of recipientIds) {
      await this.sendTemplateNotification(
        'document_uploaded',
        recipientId,
        'lawyer',
        {
          caseCode,
          documentName,
        },
        'Legal Case',
        caseId,
      );
    }
  }

  /**
   * Notify overdue cases
   */
  async notifyOverdueCase(caseId: string, caseCode: string, recipientIds: string[]): Promise<void> {
    for (const recipientId of recipientIds) {
      await this.sendTemplateNotification(
        'case_overdue',
        recipientId,
        'lawyer',
        {
          caseCode,
        },
        'Legal Case',
        caseId,
      );
    }
  }

  /**
   * Notify workload warning
   */
  async notifyWorkloadWarning(
    lawyerId: string,
    currentCases: number,
    maxCases: number,
  ): Promise<void> {
    await this.sendTemplateNotification('workload_warning', lawyerId, 'lawyer', {
      currentCases: currentCases.toString(),
      maxCases: maxCases.toString(),
    });
  }

  /**
   * Get notifications for a recipient
   */
  async getNotifications(
    recipientId: string,
    recipientType: 'lawyer' | 'admin' | 'user',
    limit: number = 50,
    offset: number = 0,
  ): Promise<Notification[]> {
    return await this.db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.recipientId, recipientId),
          eq(schema.notifications.recipientType, recipientType),
          sql`${schema.notifications.expiresAt} IS NULL OR ${schema.notifications.expiresAt} > NOW()`,
        ),
      )
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.db
        .update(schema.notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(eq(schema.notifications.id, notificationId));

      return { success: true, message: 'Notification marked as read' };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, message: 'Failed to mark notification as read' };
    }
  }

  /**
   * Mark all notifications as read for a recipient
   */
  async markAllAsRead(
    recipientId: string,
    recipientType: 'lawyer' | 'admin' | 'user',
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.db
        .update(schema.notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(schema.notifications.recipientId, recipientId),
            eq(schema.notifications.recipientType, recipientType),
          ),
        );

      return { success: true, message: 'All notifications marked as read' };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, message: 'Failed to mark all notifications as read' };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(
    recipientId: string,
    recipientType: 'lawyer' | 'admin' | 'user',
  ): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.recipientId, recipientId),
          eq(schema.notifications.recipientType, recipientType),
          eq(schema.notifications.isRead, false),
          sql`${schema.notifications.expiresAt} IS NULL OR ${schema.notifications.expiresAt} > NOW()`,
        ),
      );

    return result[0].count;
  }

  /**
   * Delete expired notifications
   */
  async deleteExpiredNotifications(): Promise<{ deletedCount: number }> {
    const result = await this.db
      .delete(schema.notifications)
      .where(
        and(
          sql`${schema.notifications.expiresAt} IS NOT NULL`,
          sql`${schema.notifications.expiresAt} <= NOW()`,
        ),
      )
      .returning({ id: schema.notifications.id });

    return { deletedCount: result.length };
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: { type: string; count: number }[];
    notificationsByPriority: { priority: string; count: number }[];
  }> {
    const totalStats = await this.db
      .select({
        total: sql<number>`count(*)`,
        unread: sql<number>`count(case when is_read = false then 1 end)`,
      })
      .from(schema.notifications);

    const typeStats = await this.db
      .select({
        type: schema.notifications.notificationType,
        count: sql<number>`count(*)`,
      })
      .from(schema.notifications)
      .groupBy(schema.notifications.notificationType);

    const priorityStats = await this.db
      .select({
        priority: schema.notifications.priority,
        count: sql<number>`count(*)`,
      })
      .from(schema.notifications)
      .groupBy(schema.notifications.priority);

    return {
      totalNotifications: totalStats[0].total,
      unreadNotifications: totalStats[0].unread,
      notificationsByType: typeStats.map((stat) => ({
        type: stat.type,
        count: stat.count,
      })),
      notificationsByPriority: priorityStats.map((stat) => ({
        priority: stat.priority,
        count: stat.count,
      })),
    };
  }
}
