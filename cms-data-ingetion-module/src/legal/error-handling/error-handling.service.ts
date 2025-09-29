import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db } from '../../db/drizzle.config';
import { errorLogs } from '../../db/schema';
import { eq, and, desc, count, gte, lte } from 'drizzle-orm';
import { CreateErrorLogDto, ResolveErrorDto, ErrorLogResponseDto, ErrorLogFilterDto } from './dto';
import { NotificationService } from './services/notification.service';
import { EscalationService } from './services/escalation.service';

// ErrorLog interface for internal use
export interface ErrorLog {
  id: string;
  errorId: string;
  source: string;
  errorType: string;
  errorCode: string;
  errorMessage: string;
  rootCauseSummary?: string;
  stackTrace?: string;
  entityAffected?: string;
  severity: string;
  retriable: boolean;
  timestamp: Date;
  createdBy: string;
  resolved: boolean;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly escalationService: EscalationService,
  ) {}

  /**
   * Log error and trigger notifications/escalation
   */
  async logError(errorData: CreateErrorLogDto): Promise<ErrorLogResponseDto> {
    try {
      // Generate unique error ID
      const errorId = this.generateErrorId(errorData.source, errorData.errorType);

      // Determine severity if not provided
      const severity = errorData.severity || this.classifySeverity(errorData);

      // Determine if retriable
      const retriable = this.isRetriable(errorData.errorType, errorData.errorCode);

      // Save error log
      const [errorLog] = await db
        .insert(errorLogs)
        .values({
          errorId,
          source: errorData.source,
          errorType: errorData.errorType,
          errorCode: errorData.errorCode,
          errorMessage: errorData.errorMessage,
          rootCauseSummary: errorData.rootCauseSummary || null,
          stackTrace: errorData.stackTrace || null,
          entityAffected: errorData.entityAffected || null,
          severity: severity as 'Info' | 'Warning' | 'Error' | 'Critical',
          retriable,
          timestamp: new Date(),
          createdBy: errorData.createdBy || 'admin',
        })
        .returning();

      // Convert database result to ErrorLog interface
      const errorLogForServices: ErrorLog = {
        ...errorLog,
        rootCauseSummary: errorLog.rootCauseSummary || undefined,
        stackTrace: errorLog.stackTrace || undefined,
        entityAffected: errorLog.entityAffected || undefined,
        resolutionNotes: errorLog.resolutionNotes || undefined,
        resolvedBy: errorLog.resolvedBy || undefined,
        resolvedAt: errorLog.resolvedAt || undefined,
        createdAt: errorLog.createdAt || new Date(),
        updatedAt: errorLog.updatedAt || new Date(),
      };

      // Trigger notifications
      await this.notificationService.sendErrorNotification(errorLogForServices);

      // Check escalation
      await this.escalationService.checkEscalation(errorLogForServices);

      this.logger.log(`Error logged: ${errorId} - ${errorData.errorMessage}`);
      return this.mapToResponseDto(errorLog);
    } catch (error) {
      this.logger.error(`Failed to log error:`, error);
      throw error;
    }
  }

  /**
   * Get error logs with filtering and pagination
   */
  async getErrorLogs(
    filterDto: ErrorLogFilterDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: ErrorLogResponseDto[]; pagination: any }> {
    try {
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = this.buildWhereConditions(filterDto);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(errorLogs)
        .where(whereConditions);

      const total = totalResult.count;

      // Get paginated results
      const errorLogsData = await db
        .select()
        .from(errorLogs)
        .where(whereConditions)
        .orderBy(desc(errorLogs.createdAt))
        .limit(limit)
        .offset(offset);

      const data = errorLogsData.map((log) => this.mapToResponseDto(log));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get error logs:`, error);
      throw error;
    }
  }

  /**
   * Get error by ID
   */
  async getErrorById(id: string): Promise<ErrorLogResponseDto> {
    try {
      const [errorLog] = await db.select().from(errorLogs).where(eq(errorLogs.id, id)).limit(1);

      if (!errorLog) {
        throw new NotFoundException(`Error log with ID ${id} not found`);
      }

      return this.mapToResponseDto(errorLog);
    } catch (error) {
      this.logger.error(`Failed to get error by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Resolve error
   */
  async resolveError(errorId: string, resolveDto: ResolveErrorDto): Promise<ErrorLogResponseDto> {
    try {
      const [updatedError] = await db
        .update(errorLogs)
        .set({
          resolved: true,
          resolutionNotes: resolveDto.resolutionNotes,
          resolvedBy: resolveDto.resolvedBy,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(errorLogs.errorId, errorId))
        .returning();

      if (!updatedError) {
        throw new NotFoundException(`Error with ID ${errorId} not found`);
      }

      this.logger.log(`Error resolved: ${errorId} by ${resolveDto.resolvedBy}`);
      return this.mapToResponseDto(updatedError);
    } catch (error) {
      this.logger.error(`Failed to resolve error ${errorId}:`, error);
      throw error;
    }
  }

  /**
   * Get error statistics for dashboard
   */
  async getErrorStatistics(filterDto?: ErrorLogFilterDto): Promise<any> {
    try {
      const whereConditions = this.buildWhereConditions(filterDto);

      // Get statistics by severity
      const severityStats = await db
        .select({
          severity: errorLogs.severity,
          count: count(),
        })
        .from(errorLogs)
        .where(whereConditions)
        .groupBy(errorLogs.severity);

      // Get statistics by source
      const sourceStats = await db
        .select({
          source: errorLogs.source,
          count: count(),
        })
        .from(errorLogs)
        .where(whereConditions)
        .groupBy(errorLogs.source);

      // Get statistics by error type
      const typeStats = await db
        .select({
          errorType: errorLogs.errorType,
          count: count(),
        })
        .from(errorLogs)
        .where(whereConditions)
        .groupBy(errorLogs.errorType);

      // Get resolution statistics
      const resolutionStats = await db
        .select({
          resolved: errorLogs.resolved,
          count: count(),
        })
        .from(errorLogs)
        .where(whereConditions)
        .groupBy(errorLogs.resolved);

      // Get recent errors (last 24 hours)
      const recentErrors = await db
        .select()
        .from(errorLogs)
        .where(
          and(
            whereConditions,
            gte(errorLogs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
          ),
        )
        .orderBy(desc(errorLogs.createdAt))
        .limit(10);

      return {
        severityStats,
        sourceStats,
        typeStats,
        resolutionStats,
        recentErrors: recentErrors.map((log) => this.mapToResponseDto(log)),
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get error statistics:`, error);
      throw error;
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(source: string, errorType: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${source.toUpperCase()}_${errorType.toUpperCase()}_${timestamp}_${random}`;
  }

  /**
   * Classify severity based on error type and code
   */
  private classifySeverity(errorData: CreateErrorLogDto): string {
    if (errorData.errorType === 'System' && errorData.errorCode.includes('500')) {
      return 'Critical';
    }
    if (errorData.errorType === 'Validation' && errorData.errorCode.includes('MANDATORY')) {
      return 'Error';
    }
    if (errorData.errorType === 'Network') {
      return 'Warning';
    }
    if (errorData.errorType === 'API' && errorData.errorCode.includes('TIMEOUT')) {
      return 'Error';
    }
    return 'Info';
  }

  /**
   * Determine if error is retriable
   */
  private isRetriable(errorType: string, errorCode: string): boolean {
    const retriableTypes = ['System', 'Network', 'API'];
    const retriableCodes = ['TIMEOUT', 'CONNECTION', '500', '503', 'UNAVAILABLE'];

    return (
      retriableTypes.includes(errorType) || retriableCodes.some((code) => errorCode.includes(code))
    );
  }

  /**
   * Build where conditions for filtering
   */
  private buildWhereConditions(filterDto?: ErrorLogFilterDto): any {
    if (!filterDto) return undefined;

    const conditions: any[] = [];

    if (filterDto.source) {
      conditions.push(eq(errorLogs.source, filterDto.source));
    }

    if (filterDto.errorType) {
      conditions.push(eq(errorLogs.errorType, filterDto.errorType));
    }

    if (filterDto.severity) {
      conditions.push(eq(errorLogs.severity, filterDto.severity));
    }

    if (filterDto.resolved !== undefined) {
      conditions.push(eq(errorLogs.resolved, filterDto.resolved));
    }

    if (filterDto.errorCode) {
      conditions.push(eq(errorLogs.errorCode, filterDto.errorCode));
    }

    if (filterDto.entityAffected) {
      conditions.push(eq(errorLogs.entityAffected, filterDto.entityAffected));
    }

    if (filterDto.createdBy) {
      conditions.push(eq(errorLogs.createdBy, filterDto.createdBy));
    }

    if (filterDto.dateFrom) {
      conditions.push(gte(errorLogs.createdAt, new Date(filterDto.dateFrom)));
    }

    if (filterDto.dateTo) {
      conditions.push(lte(errorLogs.createdAt, new Date(filterDto.dateTo)));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Map database entity to response DTO
   */
  private mapToResponseDto(errorLog: any): ErrorLogResponseDto {
    return {
      id: errorLog.id,
      errorId: errorLog.errorId,
      source: errorLog.source,
      errorType: errorLog.errorType,
      errorCode: errorLog.errorCode,
      errorMessage: errorLog.errorMessage,
      rootCauseSummary: errorLog.rootCauseSummary || undefined,
      stackTrace: errorLog.stackTrace || undefined,
      entityAffected: errorLog.entityAffected || undefined,
      severity: errorLog.severity,
      retriable: errorLog.retriable,
      resolved: errorLog.resolved,
      resolutionNotes: errorLog.resolutionNotes || undefined,
      resolvedBy: errorLog.resolvedBy || undefined,
      timestamp: errorLog.timestamp,
      createdBy: errorLog.createdBy,
      createdAt: errorLog.createdAt || new Date(),
      updatedAt: errorLog.updatedAt || new Date(),
      resolvedAt: errorLog.resolvedAt || undefined,
    };
  }
}
