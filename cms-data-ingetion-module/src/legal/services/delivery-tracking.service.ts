import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import * as schema from '../../db/schema';

export interface DeliveryStatus {
  messageId: string;
  trackingId: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED' | 'RETURNED';
  recipientId: string;
  communicationMode: string;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  bouncedAt?: Date;
  returnedAt?: Date;
  deliveryAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  errorMessage?: string;
  deliveryProof?: string;
  geoLocation?: string;
  recipientSignature?: string;
  metadata?: Record<string, any>;
}

export interface DeliveryTrackingRequest {
  messageId: string;
  trackingId?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED' | 'RETURNED';
  deliveryProof?: string;
  geoLocation?: string;
  recipientSignature?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface DeliveryStatistics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  successRate: number;
  averageDeliveryTime: number; // in hours
  byMode: Record<
    string,
    {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    }
  >;
  byStatus: Record<string, number>;
  retryStatistics: {
    totalRetries: number;
    averageRetries: number;
    maxRetries: number;
  };
}

export interface DeliveryReport {
  messageId: string;
  trackingId: string;
  recipientId: string;
  communicationMode: string;
  status: string;
  sentAt: Date;
  deliveredAt?: Date;
  deliveryTime?: number; // in minutes
  deliveryProof?: string;
  geoLocation?: string;
  recipientSignature?: string;
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class DeliveryTrackingService {
  private readonly logger = new Logger(DeliveryTrackingService.name);

  constructor(
    @Inject('DRIZZLE')
    private readonly db: any,
  ) {}

  /**
   * Track delivery status by message ID
   */
  async trackDelivery(messageId: string): Promise<DeliveryStatus | null> {
    try {
      const delivery = await this.db
        .select()
        .from(schema.communicationTracking)
        .where(eq(schema.communicationTracking.messageId, messageId))
        .limit(1);

      if (delivery.length === 0) {
        return null;
      }

      return this.mapToDeliveryStatus(delivery[0]);
    } catch (error) {
      this.logger.error(`Error tracking delivery for message ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Track delivery status by tracking ID
   */
  async trackByTrackingId(trackingId: string): Promise<DeliveryStatus | null> {
    try {
      const delivery = await this.db
        .select()
        .from(schema.communicationTracking)
        .where(eq(schema.communicationTracking.trackingId, trackingId))
        .limit(1);

      if (delivery.length === 0) {
        return null;
      }

      return this.mapToDeliveryStatus(delivery[0]);
    } catch (error) {
      this.logger.error(`Error tracking delivery for tracking ID ${trackingId}:`, error);
      return null;
    }
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(request: DeliveryTrackingRequest): Promise<DeliveryStatus> {
    try {
      const updateData: any = {
        status: request.status,
        updatedAt: new Date(),
      };

      // Set appropriate timestamps based on status
      switch (request.status) {
        case 'SENT':
          updateData.sentAt = new Date();
          break;
        case 'DELIVERED':
          updateData.deliveredAt = new Date();
          updateData.deliveryProof = request.deliveryProof;
          updateData.geoLocation = request.geoLocation;
          updateData.recipientSignature = request.recipientSignature;
          break;
        case 'FAILED':
        case 'BOUNCED':
          updateData.failedAt = new Date();
          updateData.errorMessage = request.errorMessage;
          break;
        case 'RETURNED':
          updateData.returnedAt = new Date();
          updateData.errorMessage = request.errorMessage;
          break;
      }

      if (request.metadata) {
        updateData.metadata = JSON.stringify(request.metadata);
      }

      // Update the delivery record
      const updated = await this.db
        .update(schema.communicationTracking)
        .set(updateData)
        .where(eq(schema.communicationTracking.messageId, request.messageId))
        .returning();

      if (updated.length === 0) {
        throw new NotFoundException(
          `Delivery record not found for message ID: ${request.messageId}`,
        );
      }

      this.logger.log(
        `Updated delivery status for message ${request.messageId} to ${request.status}`,
      );

      return this.mapToDeliveryStatus(updated[0]);
    } catch (error) {
      this.logger.error(`Error updating delivery status for message ${request.messageId}:`, error);
      throw error;
    }
  }

  /**
   * Get delivery status for multiple messages
   */
  async getBulkDeliveryStatus(messageIds: string[]): Promise<DeliveryStatus[]> {
    try {
      const deliveries = await this.db
        .select()
        .from(schema.communicationTracking)
        .where(sql`${schema.communicationTracking.messageId} = ANY(${messageIds})`);

      return deliveries.map((delivery) => this.mapToDeliveryStatus(delivery));
    } catch (error) {
      this.logger.error('Error getting bulk delivery status:', error);
      return [];
    }
  }

  /**
   * Get deliveries by status
   */
  async getDeliveriesByStatus(
    status: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<DeliveryStatus[]> {
    try {
      const deliveries = await this.db
        .select()
        .from(schema.communicationTracking)
        .where(eq(schema.communicationTracking.status, status))
        .orderBy(desc(schema.communicationTracking.createdAt))
        .limit(limit)
        .offset(offset);

      return deliveries.map((delivery) => this.mapToDeliveryStatus(delivery));
    } catch (error) {
      this.logger.error(`Error getting deliveries by status ${status}:`, error);
      return [];
    }
  }

  /**
   * Get deliveries by recipient
   */
  async getDeliveriesByRecipient(
    recipientId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<DeliveryStatus[]> {
    try {
      const deliveries = await this.db
        .select()
        .from(schema.communicationTracking)
        .where(eq(schema.communicationTracking.recipientId, recipientId))
        .orderBy(desc(schema.communicationTracking.createdAt))
        .limit(limit)
        .offset(offset);

      return deliveries.map((delivery) => this.mapToDeliveryStatus(delivery));
    } catch (error) {
      this.logger.error(`Error getting deliveries for recipient ${recipientId}:`, error);
      return [];
    }
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStatistics(startDate?: Date, endDate?: Date): Promise<DeliveryStatistics> {
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
      const totalDeliveries = await this.db
        .select({ count: count() })
        .from(schema.communicationTracking)
        .where(whereCondition);

      const successfulDeliveries = await this.db
        .select({ count: count() })
        .from(schema.communicationTracking)
        .where(
          whereCondition
            ? and(whereCondition, eq(schema.communicationTracking.status, 'DELIVERED'))
            : eq(schema.communicationTracking.status, 'DELIVERED'),
        );

      const failedDeliveries = await this.db
        .select({ count: count() })
        .from(schema.communicationTracking)
        .where(
          whereCondition
            ? and(whereCondition, eq(schema.communicationTracking.status, 'FAILED'))
            : eq(schema.communicationTracking.status, 'FAILED'),
        );

      const pendingDeliveries = await this.db
        .select({ count: count() })
        .from(schema.communicationTracking)
        .where(
          whereCondition
            ? and(whereCondition, eq(schema.communicationTracking.status, 'PENDING'))
            : eq(schema.communicationTracking.status, 'PENDING'),
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

      // Get statistics by status
      const byStatus = await this.db
        .select({
          status: schema.communicationTracking.status,
          count: count(),
        })
        .from(schema.communicationTracking)
        .where(whereCondition)
        .groupBy(schema.communicationTracking.status);

      // Get retry statistics
      const retryStats = await this.db
        .select({
          totalRetries: sql<number>`SUM(${schema.communicationTracking.retryCount})`,
          averageRetries: sql<number>`AVG(${schema.communicationTracking.retryCount})`,
          maxRetries: sql<number>`MAX(${schema.communicationTracking.retryCount})`,
        })
        .from(schema.communicationTracking)
        .where(whereCondition);

      // Calculate success rate
      const totalCount = totalDeliveries[0].count;
      const successfulCount = successfulDeliveries[0].count;
      const successRate = totalCount > 0 ? (successfulCount / totalCount) * 100 : 0;

      // Process by mode data
      const modeStats: Record<
        string,
        { total: number; successful: number; failed: number; successRate: number }
      > = {};
      byMode.forEach((item) => {
        if (!modeStats[item.communicationMode]) {
          modeStats[item.communicationMode] = {
            total: 0,
            successful: 0,
            failed: 0,
            successRate: 0,
          };
        }
        modeStats[item.communicationMode].total += item.count;
        if (item.status === 'DELIVERED') {
          modeStats[item.communicationMode].successful += item.count;
        } else if (item.status === 'FAILED') {
          modeStats[item.communicationMode].failed += item.count;
        }
      });

      // Calculate success rate for each mode
      Object.keys(modeStats).forEach((mode) => {
        const stats = modeStats[mode];
        stats.successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
      });

      // Process by status data
      const statusStats: Record<string, number> = {};
      byStatus.forEach((item) => {
        statusStats[item.status] = item.count;
      });

      return {
        totalDeliveries: totalCount,
        successfulDeliveries: successfulCount,
        failedDeliveries: failedDeliveries[0].count,
        pendingDeliveries: pendingDeliveries[0].count,
        successRate: Math.round(successRate * 100) / 100,
        byMode: modeStats,
        byStatus: statusStats,
        averageDeliveryTime: 0, // Would need delivery time calculation
        retryStatistics: {
          totalRetries: retryStats[0].totalRetries || 0,
          averageRetries: Math.round((retryStats[0].averageRetries || 0) * 100) / 100,
          maxRetries: retryStats[0].maxRetries || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error getting delivery statistics:', error);
      return {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        pendingDeliveries: 0,
        successRate: 0,
        byMode: {},
        byStatus: {},
        averageDeliveryTime: 0,
        retryStatistics: {
          totalRetries: 0,
          averageRetries: 0,
          maxRetries: 0,
        },
      };
    }
  }

  /**
   * Generate delivery report
   */
  async generateDeliveryReport(
    startDate?: Date,
    endDate?: Date,
    recipientId?: string,
    status?: string,
  ): Promise<DeliveryReport[]> {
    try {
      const conditions: any[] = [];

      if (startDate) {
        conditions.push(sql`${schema.communicationTracking.createdAt} >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql`${schema.communicationTracking.createdAt} <= ${endDate}`);
      }
      if (recipientId) {
        conditions.push(eq(schema.communicationTracking.recipientId, recipientId));
      }
      if (status) {
        conditions.push(eq(schema.communicationTracking.status, status));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const deliveries = await this.db
        .select()
        .from(schema.communicationTracking)
        .where(whereCondition)
        .orderBy(desc(schema.communicationTracking.createdAt));

      return deliveries.map((delivery) => this.mapToDeliveryReport(delivery));
    } catch (error) {
      this.logger.error('Error generating delivery report:', error);
      return [];
    }
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(maxRetries: number = 3): Promise<DeliveryStatus[]> {
    this.logger.log(`Retrying failed deliveries (max retries: ${maxRetries})`);

    try {
      const failedDeliveries = await this.db
        .select()
        .from(schema.communicationTracking)
        .where(
          and(
            eq(schema.communicationTracking.status, 'FAILED'),
            sql`${schema.communicationTracking.retryCount} < ${maxRetries}`,
          ),
        );

      const results: DeliveryStatus[] = [];

      for (const delivery of failedDeliveries) {
        try {
          // Increment retry count
          await this.db
            .update(schema.communicationTracking)
            .set({
              retryCount: delivery.retryCount + 1,
              status: 'PENDING',
              updatedAt: new Date(),
            })
            .where(eq(schema.communicationTracking.messageId, delivery.messageId));

          // Update next retry time
          const nextRetryAt = new Date();
          nextRetryAt.setHours(nextRetryAt.getHours() + (delivery.retryCount + 1) * 2); // Exponential backoff

          await this.db
            .update(schema.communicationTracking)
            .set({
              nextRetryAt,
            })
            .where(eq(schema.communicationTracking.messageId, delivery.messageId));

          results.push(this.mapToDeliveryStatus(delivery));
        } catch (error) {
          this.logger.error(`Error retrying delivery ${delivery.messageId}:`, error);
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error retrying failed deliveries:', error);
      return [];
    }
  }

  // Private helper methods

  private mapToDeliveryStatus(record: any): DeliveryStatus {
    return {
      messageId: record.messageId,
      trackingId: record.trackingId,
      status: record.status,
      recipientId: record.recipientId,
      communicationMode: record.communicationMode,
      sentAt: record.sentAt,
      deliveredAt: record.deliveredAt,
      failedAt: record.failedAt,
      bouncedAt: record.bouncedAt,
      returnedAt: record.returnedAt,
      deliveryAttempts: record.retryCount,
      lastAttemptAt: record.updatedAt,
      nextRetryAt: record.nextRetryAt,
      errorMessage: record.errorMessage,
      deliveryProof: record.deliveryProof,
      geoLocation: record.geoLocation,
      recipientSignature: record.recipientSignature,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
    };
  }

  private mapToDeliveryReport(record: any): DeliveryReport {
    const deliveryTime =
      record.deliveredAt && record.sentAt
        ? Math.round((record.deliveredAt.getTime() - record.sentAt.getTime()) / (1000 * 60))
        : undefined;

    return {
      messageId: record.messageId,
      trackingId: record.trackingId,
      recipientId: record.recipientId,
      communicationMode: record.communicationMode,
      status: record.status,
      sentAt: record.sentAt,
      deliveredAt: record.deliveredAt,
      deliveryTime,
      deliveryProof: record.deliveryProof,
      geoLocation: record.geoLocation,
      recipientSignature: record.recipientSignature,
      errorMessage: record.errorMessage,
      retryCount: record.retryCount,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
    };
  }
}
