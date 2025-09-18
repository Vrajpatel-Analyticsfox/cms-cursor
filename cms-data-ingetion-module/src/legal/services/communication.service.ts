import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import * as schema from '../../db/schema';

export interface CommunicationRequest {
  recipientId: string;
  recipientType: 'borrower' | 'lawyer' | 'admin' | 'user';
  communicationMode: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'COURIER' | 'POST' | 'PHYSICAL_DELIVERY';
  subject?: string;
  content: string;
  templateId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface CommunicationResult {
  success: boolean;
  messageId?: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  errorMessage?: string;
  deliveryTimestamp?: Date;
  trackingId?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface DeliveryTracking {
  messageId: string;
  communicationMode: string;
  recipientId: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  trackingId?: string;
  metadata?: Record<string, any>;
}

export interface CommunicationStatistics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  successRate: number;
  byMode: Record<string, { sent: number; delivered: number; failed: number }>;
  byPriority: Record<string, number>;
  averageDeliveryTime: number; // in minutes
}

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    @Inject('DRIZZLE')
    private readonly db: any,
  ) {}

  /**
   * Send communication via multiple channels
   */
  async sendCommunication(request: CommunicationRequest): Promise<CommunicationResult> {
    this.logger.log(`Sending ${request.communicationMode} communication to ${request.recipientId}`);

    try {
      // Validate request
      await this.validateCommunicationRequest(request);

      // Generate message ID
      const messageId = this.generateMessageId(request.communicationMode);

      // Send based on communication mode
      let result: CommunicationResult;

      switch (request.communicationMode) {
        case 'EMAIL':
          result = await this.sendEmail(request, messageId);
          break;
        case 'SMS':
          result = await this.sendSMS(request, messageId);
          break;
        case 'WHATSAPP':
          result = await this.sendWhatsApp(request, messageId);
          break;
        case 'COURIER':
          result = await this.sendCourier(request, messageId);
          break;
        case 'POST':
          result = await this.sendPost(request, messageId);
          break;
        case 'PHYSICAL_DELIVERY':
          result = await this.sendPhysicalDelivery(request, messageId);
          break;
        default:
          throw new BadRequestException(
            `Unsupported communication mode: ${request.communicationMode}`,
          );
      }

      // Save communication record
      await this.saveCommunicationRecord(request, result, messageId);

      return result;
    } catch (error) {
      this.logger.error(`Error sending communication: ${error.message}`);
      return {
        success: false,
        deliveryStatus: 'FAILED',
        errorMessage: error.message,
        retryCount: 0,
      };
    }
  }

  /**
   * Send batch communications
   */
  async sendBatchCommunications(requests: CommunicationRequest[]): Promise<CommunicationResult[]> {
    this.logger.log(`Sending batch communications for ${requests.length} recipients`);

    const results: CommunicationResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.sendCommunication(request);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          deliveryStatus: 'FAILED',
          errorMessage: error.message,
          retryCount: 0,
        });
      }
    }

    return results;
  }

  /**
   * Track delivery status
   */
  async trackDelivery(messageId: string): Promise<DeliveryTracking | null> {
    try {
      const tracking = await this.db
        .select()
        .from(schema.communicationTracking)
        .where(eq(schema.communicationTracking.messageId, messageId))
        .limit(1);

      if (tracking.length === 0) {
        return null;
      }

      return this.mapToDeliveryTracking(tracking[0]);
    } catch (error) {
      this.logger.error(`Error tracking delivery for message ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    messageId: string,
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED',
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'SENT') {
        updateData.sentAt = new Date();
      } else if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      } else if (status === 'FAILED' || status === 'BOUNCED') {
        updateData.failedAt = new Date();
      }

      if (metadata) {
        updateData.metadata = JSON.stringify(metadata);
      }

      await this.db
        .update(schema.communicationTracking)
        .set(updateData)
        .where(eq(schema.communicationTracking.messageId, messageId));

      this.logger.log(`Updated delivery status for message ${messageId} to ${status}`);
    } catch (error) {
      this.logger.error(`Error updating delivery status for message ${messageId}:`, error);
    }
  }

  /**
   * Retry failed communications
   */
  async retryFailedCommunications(maxRetries: number = 3): Promise<CommunicationResult[]> {
    this.logger.log(`Retrying failed communications (max retries: ${maxRetries})`);

    try {
      const failedCommunications = await this.db
        .select()
        .from(schema.communicationTracking)
        .where(
          and(
            eq(schema.communicationTracking.status, 'FAILED'),
            sql`${schema.communicationTracking.retryCount} < ${maxRetries}`,
          ),
        );

      const results: CommunicationResult[] = [];

      for (const comm of failedCommunications) {
        try {
          // Increment retry count
          await this.db
            .update(schema.communicationTracking)
            .set({
              retryCount: comm.retryCount + 1,
              updatedAt: new Date(),
            })
            .where(eq(schema.communicationTracking.messageId, comm.messageId));

          // Retry sending
          const request: CommunicationRequest = {
            recipientId: comm.recipientId,
            recipientType: comm.recipientType as any,
            communicationMode: comm.communicationMode as any,
            subject: comm.subject,
            content: comm.content,
            priority: comm.priority as any,
            metadata: comm.metadata ? JSON.parse(comm.metadata) : undefined,
          };

          const result = await this.sendCommunication(request);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            deliveryStatus: 'FAILED',
            errorMessage: error.message,
            retryCount: comm.retryCount + 1,
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error retrying failed communications:', error);
      return [];
    }
  }

  /**
   * Get communication statistics
   */
  async getCommunicationStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<CommunicationStatistics> {
    try {
      const conditions: any[] = [];

      if (startDate) {
        conditions.push(sql`${schema.communicationTracking.createdAt} >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql`${schema.communicationTracking.createdAt} <= ${endDate}`);
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total counts
      const totalSent = await this.db
        .select({ count: count() })
        .from(schema.communicationTracking)
        .where(whereCondition);

      const totalDelivered = await this.db
        .select({ count: count() })
        .from(schema.communicationTracking)
        .where(
          whereCondition
            ? and(whereCondition, eq(schema.communicationTracking.status, 'DELIVERED'))
            : eq(schema.communicationTracking.status, 'DELIVERED'),
        );

      const totalFailed = await this.db
        .select({ count: count() })
        .from(schema.communicationTracking)
        .where(
          whereCondition
            ? and(whereCondition, eq(schema.communicationTracking.status, 'FAILED'))
            : eq(schema.communicationTracking.status, 'FAILED'),
        );

      // Get statistics by mode
      const byMode = await this.db
        .select({
          communicationMode: schema.communicationTracking.communicationMode,
          status: schema.communicationTracking.status,
          count: count(),
        })
        .from(schema.communicationTracking)
        .where(whereCondition)
        .groupBy(
          schema.communicationTracking.communicationMode,
          schema.communicationTracking.status,
        );

      // Get statistics by priority
      const byPriority = await this.db
        .select({
          priority: schema.communicationTracking.priority,
          count: count(),
        })
        .from(schema.communicationTracking)
        .where(whereCondition)
        .groupBy(schema.communicationTracking.priority);

      // Calculate success rate
      const totalSentCount = totalSent[0].count;
      const totalDeliveredCount = totalDelivered[0].count;
      const successRate = totalSentCount > 0 ? (totalDeliveredCount / totalSentCount) * 100 : 0;

      // Process by mode data
      const modeStats: Record<string, { sent: number; delivered: number; failed: number }> = {};
      byMode.forEach((item) => {
        if (!modeStats[item.communicationMode]) {
          modeStats[item.communicationMode] = { sent: 0, delivered: 0, failed: 0 };
        }
        modeStats[item.communicationMode][
          item.status.toLowerCase() as keyof (typeof modeStats)[string]
        ] = item.count;
      });

      // Process by priority data
      const priorityStats: Record<string, number> = {};
      byPriority.forEach((item) => {
        priorityStats[item.priority] = item.count;
      });

      return {
        totalSent: totalSentCount,
        totalDelivered: totalDeliveredCount,
        totalFailed: totalFailed[0].count,
        successRate: Math.round(successRate * 100) / 100,
        byMode: modeStats,
        byPriority: priorityStats,
        averageDeliveryTime: 0, // Would need delivery time calculation
      };
    } catch (error) {
      this.logger.error('Error getting communication statistics:', error);
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        successRate: 0,
        byMode: {},
        byPriority: {},
        averageDeliveryTime: 0,
      };
    }
  }

  // Private methods for different communication modes

  private async sendEmail(
    request: CommunicationRequest,
    messageId: string,
  ): Promise<CommunicationResult> {
    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    this.logger.log(`Sending email to ${request.recipientId}`);

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      messageId,
      deliveryStatus: 'SENT',
      deliveryTimestamp: new Date(),
      trackingId: `EMAIL-${messageId}`,
      retryCount: 0,
    };
  }

  private async sendSMS(
    request: CommunicationRequest,
    messageId: string,
  ): Promise<CommunicationResult> {
    // TODO: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
    this.logger.log(`Sending SMS to ${request.recipientId}`);

    // Simulate SMS sending
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      messageId,
      deliveryStatus: 'SENT',
      deliveryTimestamp: new Date(),
      trackingId: `SMS-${messageId}`,
      retryCount: 0,
    };
  }

  private async sendWhatsApp(
    request: CommunicationRequest,
    messageId: string,
  ): Promise<CommunicationResult> {
    // TODO: Integrate with WhatsApp Business API
    this.logger.log(`Sending WhatsApp message to ${request.recipientId}`);

    // Simulate WhatsApp sending
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      messageId,
      deliveryStatus: 'SENT',
      deliveryTimestamp: new Date(),
      trackingId: `WA-${messageId}`,
      retryCount: 0,
    };
  }

  private async sendCourier(
    request: CommunicationRequest,
    messageId: string,
  ): Promise<CommunicationResult> {
    // TODO: Integrate with courier service (Blue Dart, DTDC, etc.)
    this.logger.log(`Sending courier to ${request.recipientId}`);

    // Simulate courier booking
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      success: true,
      messageId,
      deliveryStatus: 'PENDING',
      deliveryTimestamp: new Date(),
      trackingId: `COURIER-${messageId}`,
      retryCount: 0,
    };
  }

  private async sendPost(
    request: CommunicationRequest,
    messageId: string,
  ): Promise<CommunicationResult> {
    // TODO: Integrate with postal service
    this.logger.log(`Sending post to ${request.recipientId}`);

    // Simulate post sending
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      messageId,
      deliveryStatus: 'PENDING',
      deliveryTimestamp: new Date(),
      trackingId: `POST-${messageId}`,
      retryCount: 0,
    };
  }

  private async sendPhysicalDelivery(
    request: CommunicationRequest,
    messageId: string,
  ): Promise<CommunicationResult> {
    // TODO: Integrate with field agent system
    this.logger.log(`Scheduling physical delivery to ${request.recipientId}`);

    // Simulate physical delivery scheduling
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      messageId,
      deliveryStatus: 'PENDING',
      deliveryTimestamp: new Date(),
      trackingId: `PHYSICAL-${messageId}`,
      retryCount: 0,
    };
  }

  private async validateCommunicationRequest(request: CommunicationRequest): Promise<void> {
    if (!request.recipientId) {
      throw new BadRequestException('Recipient ID is required');
    }
    if (!request.communicationMode) {
      throw new BadRequestException('Communication mode is required');
    }
    if (!request.content) {
      throw new BadRequestException('Content is required');
    }
    if (!request.priority) {
      throw new BadRequestException('Priority is required');
    }
  }

  private generateMessageId(mode: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${mode}-${timestamp}-${random}`;
  }

  private async saveCommunicationRecord(
    request: CommunicationRequest,
    result: CommunicationResult,
    messageId: string,
  ): Promise<void> {
    try {
      await this.db.insert(schema.communicationTracking).values({
        messageId,
        recipientId: request.recipientId,
        recipientType: request.recipientType,
        communicationMode: request.communicationMode,
        subject: request.subject,
        content: request.content,
        templateId: request.templateId,
        priority: request.priority,
        status: result.deliveryStatus,
        sentAt: result.deliveryTimestamp,
        trackingId: result.trackingId,
        retryCount: result.retryCount,
        errorMessage: result.errorMessage,
        metadata: request.metadata ? JSON.stringify(request.metadata) : null,
        scheduledAt: request.scheduledAt,
        createdBy: 'system',
      });
    } catch (error) {
      this.logger.error('Error saving communication record:', error);
    }
  }

  private mapToDeliveryTracking(record: any): DeliveryTracking {
    return {
      messageId: record.messageId,
      communicationMode: record.communicationMode,
      recipientId: record.recipientId,
      status: record.status,
      sentAt: record.sentAt,
      deliveredAt: record.deliveredAt,
      failedAt: record.failedAt,
      errorMessage: record.errorMessage,
      retryCount: record.retryCount,
      trackingId: record.trackingId,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
    };
  }
}
