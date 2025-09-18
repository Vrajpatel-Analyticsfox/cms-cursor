import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, gte, lte, isNull, desc, count, sql } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { DataIngestionHelperService } from './data-ingestion-helper.service';

export interface TriggerEvent {
  id: string;
  loanAccountId: string;
  loanAccountNumber: string;
  borrowerName: string;
  triggerType:
    | 'DPD_THRESHOLD'
    | 'PAYMENT_FAILURE'
    | 'MANUAL_TRIGGER'
    | 'BROKEN_PTP'
    | 'ACKNOWLEDGEMENT_PENDING';
  dpdDays: number;
  outstandingAmount: number;
  lastPaymentDate?: Date;
  detectedAt: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  eligibilityStatus: 'ELIGIBLE' | 'INELIGIBLE' | 'PENDING_REVIEW';
  metadata: Record<string, any>;
}

export interface TriggerDetectionResult {
  eligibleAccounts: TriggerEvent[];
  ineligibleAccounts: Array<{ accountNumber: string; reason: string }>;
  errors: Array<{ accountNumber: string; error: string }>;
  executionTime: number;
}

export interface TriggerStatistics {
  totalTriggers: number;
  triggersByType: Record<string, number>;
  triggersBySeverity: Record<string, number>;
  eligibleCount: number;
  ineligibleCount: number;
  errorCount: number;
  lastExecutionTime: Date;
}

@Injectable()
export class TriggerDetectionService {
  private readonly logger = new Logger(TriggerDetectionService.name);

  constructor(
    @Inject('DRIZZLE')
    private readonly db: any,
    private readonly dataIngestionHelper: DataIngestionHelperService,
  ) {}

  /**
   * Automated trigger detection - runs daily via cron
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async runAutomatedDetection(): Promise<TriggerDetectionResult> {
    const startTime = Date.now();
    this.logger.log('Starting automated trigger detection');

    try {
      // Get all loan account numbers
      const allAccounts = await this.dataIngestionHelper.getAllLoanAccountNumbers();

      const eligibleAccounts: TriggerEvent[] = [];
      const ineligibleAccounts: Array<{ accountNumber: string; reason: string }> = [];
      const errors: Array<{ accountNumber: string; error: string }> = [];

      // Process each account
      for (const accountNumber of allAccounts) {
        try {
          const triggers = await this.detectTriggersForAccount(accountNumber);
          eligibleAccounts.push(...triggers.filter((t) => t.eligibilityStatus === 'ELIGIBLE'));
          ineligibleAccounts.push(
            ...triggers
              .filter((t) => t.eligibilityStatus === 'INELIGIBLE')
              .map((t) => ({
                accountNumber: t.loanAccountNumber,
                reason: t.metadata.reason || 'Not eligible',
              })),
          );
        } catch (error) {
          errors.push({ accountNumber, error: error.message });
        }
      }

      const executionTime = Date.now() - startTime;
      this.logger.log(`Automated detection completed in ${executionTime}ms`);

      return {
        eligibleAccounts,
        ineligibleAccounts,
        errors,
        executionTime,
      };
    } catch (error) {
      this.logger.error('Error in automated trigger detection:', error);
      return {
        eligibleAccounts: [],
        ineligibleAccounts: [],
        errors: [{ accountNumber: 'SYSTEM', error: error.message }],
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Manual trigger detection for specific accounts
   */
  async runManualDetection(
    accountNumbers: string[],
    triggerTypes?: string[],
  ): Promise<TriggerDetectionResult> {
    const startTime = Date.now();
    this.logger.log(`Starting manual trigger detection for ${accountNumbers.length} accounts`);

    const eligibleAccounts: TriggerEvent[] = [];
    const ineligibleAccounts: Array<{ accountNumber: string; reason: string }> = [];
    const errors: Array<{ accountNumber: string; error: string }> = [];

    for (const accountNumber of accountNumbers) {
      try {
        const triggers = await this.detectTriggersForAccount(accountNumber, triggerTypes);
        eligibleAccounts.push(...triggers.filter((t) => t.eligibilityStatus === 'ELIGIBLE'));
        ineligibleAccounts.push(
          ...triggers
            .filter((t) => t.eligibilityStatus === 'INELIGIBLE')
            .map((t) => ({
              accountNumber: t.loanAccountNumber,
              reason: t.metadata.reason || 'Not eligible',
            })),
        );
      } catch (error) {
        errors.push({ accountNumber, error: error.message });
      }
    }

    return {
      eligibleAccounts,
      ineligibleAccounts,
      errors,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Detect DPD threshold breaches
   */
  async detectDpdThresholdBreaches(): Promise<TriggerEvent[]> {
    this.logger.log('Detecting DPD threshold breaches');

    const triggers: TriggerEvent[] = [];
    const allAccounts = await this.dataIngestionHelper.getAllLoanAccountNumbers();

    for (const accountNumber of allAccounts) {
      try {
        const borrowerData = await this.dataIngestionHelper.getBorrowerData(accountNumber);
        const dpdDays = borrowerData.currentDpd || 0;

        // Define DPD thresholds
        const thresholds = [
          { days: 30, severity: 'LOW' as const },
          { days: 60, severity: 'MEDIUM' as const },
          { days: 90, severity: 'HIGH' as const },
          { days: 120, severity: 'CRITICAL' as const },
        ];

        for (const threshold of thresholds) {
          if (dpdDays >= threshold.days) {
            const trigger: TriggerEvent = {
              id: `trigger_${Date.now()}_${accountNumber}`,
              loanAccountId: accountNumber,
              loanAccountNumber: accountNumber,
              borrowerName: borrowerData.borrowerName,
              triggerType: 'DPD_THRESHOLD',
              dpdDays,
              outstandingAmount: parseFloat(borrowerData.outstandingAmount || '0'),
              detectedAt: new Date(),
              severity: threshold.severity,
              eligibilityStatus: 'ELIGIBLE',
              metadata: {
                threshold: threshold.days,
                triggerReason: `DPD exceeded ${threshold.days} days`,
                outstandingAmount: borrowerData.outstandingAmount,
                productType: borrowerData.productType,
              },
            };
            triggers.push(trigger);
            break; // Only create one trigger per account for the highest threshold reached
          }
        }
      } catch (error) {
        this.logger.error(`Error detecting DPD breach for account ${accountNumber}:`, error);
      }
    }

    return triggers;
  }

  /**
   * Detect payment failures
   */
  async detectPaymentFailures(): Promise<TriggerEvent[]> {
    this.logger.log('Detecting payment failures');

    const triggers: TriggerEvent[] = [];
    const allAccounts = await this.dataIngestionHelper.getAllLoanAccountNumbers();

    for (const accountNumber of allAccounts) {
      try {
        const borrowerData = await this.dataIngestionHelper.getBorrowerData(accountNumber);
        const dpdDays = borrowerData.currentDpd || 0;

        // Consider payment failure if DPD > 0 and no recent payment
        if (dpdDays > 0) {
          const trigger: TriggerEvent = {
            id: `trigger_${Date.now()}_${accountNumber}`,
            loanAccountId: accountNumber,
            loanAccountNumber: accountNumber,
            borrowerName: borrowerData.borrowerName,
            triggerType: 'PAYMENT_FAILURE',
            dpdDays,
            outstandingAmount: parseFloat(borrowerData.outstandingAmount || '0'),
            detectedAt: new Date(),
            severity: dpdDays > 60 ? 'HIGH' : dpdDays > 30 ? 'MEDIUM' : 'LOW',
            eligibilityStatus: 'ELIGIBLE',
            metadata: {
              triggerReason: 'Payment failure detected',
              outstandingAmount: borrowerData.outstandingAmount,
              productType: borrowerData.productType,
            },
          };
          triggers.push(trigger);
        }
      } catch (error) {
        this.logger.error(`Error detecting payment failure for account ${accountNumber}:`, error);
      }
    }

    return triggers;
  }

  /**
   * Detect triggers for a specific account
   */
  async detectTriggersForAccount(
    accountNumber: string,
    triggerTypes?: string[],
  ): Promise<TriggerEvent[]> {
    this.logger.log(`Detecting triggers for account: ${accountNumber}`);

    const triggers: TriggerEvent[] = [];

    try {
      const borrowerData = await this.dataIngestionHelper.getBorrowerData(accountNumber);
      const dpdDays = borrowerData.currentDpd || 0;
      const outstandingAmount = parseFloat(borrowerData.outstandingAmount || '0');

      // Check if specific trigger types are requested
      const typesToCheck = triggerTypes || ['DPD_THRESHOLD', 'PAYMENT_FAILURE'];

      // DPD Threshold detection
      if (typesToCheck.includes('DPD_THRESHOLD')) {
        const dpdTriggers = await this.detectDpdThresholdBreaches();
        triggers.push(...dpdTriggers.filter((t) => t.loanAccountNumber === accountNumber));
      }

      // Payment Failure detection
      if (typesToCheck.includes('PAYMENT_FAILURE')) {
        const paymentTriggers = await this.detectPaymentFailures();
        triggers.push(...paymentTriggers.filter((t) => t.loanAccountNumber === accountNumber));
      }

      // Broken PTP detection (simplified - would need PTP data)
      if (typesToCheck.includes('BROKEN_PTP')) {
        // This would require PTP (Promise to Pay) data
        // For now, we'll create a placeholder
        if (dpdDays > 45) {
          const trigger: TriggerEvent = {
            id: `trigger_${Date.now()}_${accountNumber}`,
            loanAccountId: accountNumber,
            loanAccountNumber: accountNumber,
            borrowerName: borrowerData.borrowerName,
            triggerType: 'BROKEN_PTP',
            dpdDays,
            outstandingAmount,
            detectedAt: new Date(),
            severity: 'MEDIUM',
            eligibilityStatus: 'ELIGIBLE',
            metadata: {
              triggerReason: 'Potential broken PTP detected',
              outstandingAmount: borrowerData.outstandingAmount,
            },
          };
          triggers.push(trigger);
        }
      }

      // Acknowledgement Pending detection
      if (typesToCheck.includes('ACKNOWLEDGEMENT_PENDING')) {
        // Check if there are pending acknowledgements
        const pendingNotices = await this.db
          .select()
          .from(schema.legalNotices)
          .where(
            and(
              eq(schema.legalNotices.loanAccountNumber, accountNumber),
              eq(schema.legalNotices.acknowledgementRequired, true),
              eq(schema.legalNotices.noticeStatus, 'Sent'),
            ),
          );

        if (pendingNotices.length > 0) {
          const trigger: TriggerEvent = {
            id: `trigger_${Date.now()}_${accountNumber}`,
            loanAccountId: accountNumber,
            loanAccountNumber: accountNumber,
            borrowerName: borrowerData.borrowerName,
            triggerType: 'ACKNOWLEDGEMENT_PENDING',
            dpdDays,
            outstandingAmount,
            detectedAt: new Date(),
            severity: 'LOW',
            eligibilityStatus: 'ELIGIBLE',
            metadata: {
              triggerReason: 'Acknowledgement pending for sent notices',
              pendingNoticesCount: pendingNotices.length,
            },
          };
          triggers.push(trigger);
        }
      }

      // Save triggers to database
      for (const trigger of triggers) {
        await this.saveTriggerToDatabase(trigger);
      }
    } catch (error) {
      this.logger.error(`Error detecting triggers for account ${accountNumber}:`, error);
      throw error;
    }

    return triggers;
  }

  /**
   * Get trigger statistics
   */
  async getTriggerStatistics(): Promise<TriggerStatistics> {
    try {
      const totalTriggers = await this.db.select({ count: count() }).from(schema.recoveryTriggers);

      const triggersByType = await this.db
        .select({
          triggerType: schema.recoveryTriggers.triggerType,
          count: count(),
        })
        .from(schema.recoveryTriggers)
        .groupBy(schema.recoveryTriggers.triggerType);

      const triggersBySeverity = await this.db
        .select({
          severity: schema.recoveryTriggers.triggerSeverity,
          count: count(),
        })
        .from(schema.recoveryTriggers)
        .groupBy(schema.recoveryTriggers.triggerSeverity);

      const eligibleCount = await this.db
        .select({ count: count() })
        .from(schema.recoveryTriggers)
        .where(eq(schema.recoveryTriggers.triggerStatus, 'Open'));

      const ineligibleCount = await this.db
        .select({ count: count() })
        .from(schema.recoveryTriggers)
        .where(eq(schema.recoveryTriggers.triggerStatus, 'Closed'));

      return {
        totalTriggers: totalTriggers[0].count,
        triggersByType: triggersByType.reduce((acc, item) => {
          acc[item.triggerType] = item.count;
          return acc;
        }, {}),
        triggersBySeverity: triggersBySeverity.reduce((acc, item) => {
          acc[item.severity] = item.count;
          return acc;
        }, {}),
        eligibleCount: eligibleCount[0].count,
        ineligibleCount: ineligibleCount[0].count,
        errorCount: 0, // Would need error tracking
        lastExecutionTime: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting trigger statistics:', error);
      return {
        totalTriggers: 0,
        triggersByType: {},
        triggersBySeverity: {},
        eligibleCount: 0,
        ineligibleCount: 0,
        errorCount: 0,
        lastExecutionTime: new Date(),
      };
    }
  }

  /**
   * Save trigger to database
   */
  private async saveTriggerToDatabase(trigger: TriggerEvent): Promise<void> {
    try {
      const triggerCode = `TRG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      await this.db.insert(schema.recoveryTriggers).values({
        triggerCode,
        loanAccountNumber: trigger.loanAccountNumber,
        triggerType: trigger.triggerType,
        triggerCriteria: trigger.metadata.triggerReason || 'Automated detection',
        triggeredDateOn: trigger.detectedAt,
        triggerSeverity: trigger.severity,
        actionRequired: 'Generate notice',
        triggerStatus: 'Open',
        dpdDays: trigger.dpdDays,
        outstandingAmount: trigger.outstandingAmount.toString(),
        metadata: JSON.stringify(trigger.metadata),
        isActive: true,
        remarks: `Auto-generated trigger for ${trigger.triggerType}`,
        createdBy: 'system',
      });
    } catch (error) {
      this.logger.error('Error saving trigger to database:', error);
    }
  }
}
