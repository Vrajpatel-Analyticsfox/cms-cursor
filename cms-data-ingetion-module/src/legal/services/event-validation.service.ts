import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, gte, lte, desc, count, or } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { DataIngestionHelperService } from './data-ingestion-helper.service';
import { TriggerEvent } from './trigger-detection.service';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'BUSINESS' | 'TECHNICAL' | 'COMPLIANCE' | 'RISK';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  isActive: boolean;
  validator: (event: TriggerEvent, context: ValidationContext) => Promise<ValidationResult>;
}

export interface ValidationContext {
  loanAccount: any;
  borrowerProfile: any;
  recentNotices: any[];
  systemConfiguration: any;
  dpdBuckets: any[];
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  details?: Record<string, any>;
  recommendation?: string;
}

export interface EventValidationResult {
  event: TriggerEvent;
  isValid: boolean;
  eligibilityStatus: 'ELIGIBLE' | 'INELIGIBLE' | 'PENDING_REVIEW';
  overallScore: number; // 0-100 eligibility score
  validationResults: ValidationResult[];
  errors: ValidationResult[];
  warnings: ValidationResult[];
  recommendations: string[];
  processedAt: Date;
}

@Injectable()
export class EventValidationService {
  private readonly logger = new Logger(EventValidationService.name);
  private validationRules: ValidationRule[] = [];

  constructor(
    @Inject('DRIZZLE')
    private readonly db: any,
    private readonly dataIngestionHelper: DataIngestionHelperService,
  ) {
    this.initializeValidationRules();
  }

  /**
   * VALIDATE TRIGGER EVENT
   * Comprehensive validation of trigger events for notice generation eligibility
   */
  async validateTriggerEvent(event: TriggerEvent): Promise<EventValidationResult> {
    this.logger.debug(`Validating trigger event: ${event.id}`);

    try {
      // Step 1: Gather validation context
      const context = await this.gatherValidationContext(event);

      // Step 2: Run all validation rules
      const validationResults: ValidationResult[] = [];

      for (const rule of this.validationRules.filter((r) => r.isActive)) {
        try {
          const result = await rule.validator(event, context);
          validationResults.push(result);
        } catch (error) {
          this.logger.error(`Error in validation rule ${rule.id}:`, error);
          validationResults.push({
            ruleId: rule.id,
            passed: false,
            severity: 'ERROR',
            message: `Validation rule failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      // Step 3: Calculate overall eligibility
      const eligibilityResult = this.calculateEligibility(validationResults);

      // Step 4: Generate recommendations
      const recommendations = this.generateRecommendations(validationResults, context);

      const result: EventValidationResult = {
        event,
        isValid: eligibilityResult.isValid,
        eligibilityStatus: eligibilityResult.status,
        overallScore: eligibilityResult.score,
        validationResults,
        errors: validationResults.filter(
          (r) => r.severity === 'ERROR' || r.severity === 'CRITICAL',
        ),
        warnings: validationResults.filter((r) => r.severity === 'WARNING'),
        recommendations,
        processedAt: new Date(),
      };

      this.logger.debug(
        `Validation completed for event ${event.id}: ${result.eligibilityStatus} (Score: ${result.overallScore})`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error validating trigger event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * VALIDATE MULTIPLE EVENTS in batch
   */
  async validateTriggerEvents(events: TriggerEvent[]): Promise<EventValidationResult[]> {
    this.logger.log(`Starting batch validation of ${events.length} trigger events`);

    const results: EventValidationResult[] = [];
    const batchSize = 10; // Process in batches to prevent overwhelming the system

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map((event) => this.validateTriggerEvent(event)),
      );

      results.push(...batchResults);

      // Brief pause between batches
      if (i + batchSize < events.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const eligibleCount = results.filter((r) => r.eligibilityStatus === 'ELIGIBLE').length;
    const ineligibleCount = results.filter((r) => r.eligibilityStatus === 'INELIGIBLE').length;

    this.logger.log(
      `Batch validation completed: ${eligibleCount} eligible, ${ineligibleCount} ineligible out of ${events.length} events`,
    );

    return results;
  }

  /**
   * GATHER VALIDATION CONTEXT
   * Collects all necessary data for comprehensive validation
   */
  private async gatherValidationContext(event: TriggerEvent): Promise<ValidationContext> {
    try {
      // Get loan account details from data ingestion validated table
      const borrowerData = await this.dataIngestionHelper.getBorrowerData(event.loanAccountId);

      // Create a loan account object for compatibility
      const loanAccount = {
        id: borrowerData.loanAccountNumber,
        accountNumber: borrowerData.loanAccountNumber,
        borrowerName: borrowerData.borrowerName,
        borrowerMobile: borrowerData.borrowerMobile,
        borrowerEmail: borrowerData.borrowerEmail,
        borrowerAddress: borrowerData.borrowerAddress,
        loanAmount: borrowerData.loanAmount,
        outstandingAmount: borrowerData.outstandingAmount,
        currentDpd: borrowerData.currentDpd,
        productType: borrowerData.productType,
        branchCode: borrowerData.branchCode,
        status: 'active',
      };

      // Get recent notices for the account (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentNotices = await this.db
        .select()
        .from(schema.legalNotices)
        .where(
          and(
            eq(schema.legalNotices.loanAccountNumber, event.loanAccountId),
            gte(schema.legalNotices.noticeGenerationDate, thirtyDaysAgo),
          ),
        )
        .orderBy(desc(schema.legalNotices.noticeGenerationDate));

      // Get DPD buckets configuration
      const dpdBuckets = await this.db
        .select()
        .from(schema.dpdBuckets)
        .where(eq(schema.dpdBuckets.isActive, true))
        .orderBy(schema.dpdBuckets.minDays);

      // Get system configuration (simulated - would be from a config table)
      const systemConfiguration = {
        maxNoticesPerMonth: 2,
        minDpdForNotice: 30,
        cooldownPeriodDays: 7,
        enableWeekendNotices: false,
        businessHoursOnly: true,
        excludedProductTypes: ['STAFF_LOAN'],
        highValueThreshold: 500000,
      };

      return {
        loanAccount: loanAccount,
        borrowerProfile: {
          // In production, this would fetch from borrower/customer table
          creditScore: 650, // Simulated
          riskCategory: 'MEDIUM',
          preferredLanguage: 'en',
          communicationPreference: 'EMAIL',
        },
        recentNotices,
        systemConfiguration,
        dpdBuckets,
      };
    } catch (error) {
      this.logger.error('Error gathering validation context:', error);
      throw error;
    }
  }

  /**
   * CALCULATE OVERALL ELIGIBILITY
   */
  private calculateEligibility(validationResults: ValidationResult[]): {
    isValid: boolean;
    status: 'ELIGIBLE' | 'INELIGIBLE' | 'PENDING_REVIEW';
    score: number;
  } {
    const errors = validationResults.filter(
      (r) => r.severity === 'ERROR' || r.severity === 'CRITICAL',
    );
    const warnings = validationResults.filter((r) => r.severity === 'WARNING');
    const passed = validationResults.filter((r) => r.passed);

    // Calculate score (0-100)
    const totalRules = validationResults.length;
    const passedRules = passed.length;
    const warningPenalty = warnings.length * 5; // 5 points per warning
    const errorPenalty = errors.length * 20; // 20 points per error

    let score = totalRules > 0 ? (passedRules / totalRules) * 100 : 0;
    score = Math.max(0, score - warningPenalty - errorPenalty);

    // Determine eligibility status
    let status: 'ELIGIBLE' | 'INELIGIBLE' | 'PENDING_REVIEW';
    let isValid: boolean;

    if (errors.length > 0) {
      status = 'INELIGIBLE';
      isValid = false;
    } else if (warnings.length > 2 || score < 70) {
      status = 'PENDING_REVIEW';
      isValid = false;
    } else {
      status = 'ELIGIBLE';
      isValid = true;
    }

    return { isValid, status, score: Math.round(score) };
  }

  /**
   * GENERATE RECOMMENDATIONS
   */
  private generateRecommendations(
    validationResults: ValidationResult[],
    context: ValidationContext,
  ): string[] {
    const recommendations: string[] = [];

    // Collect recommendations from validation results
    validationResults.forEach((result) => {
      if (result.recommendation) {
        recommendations.push(result.recommendation);
      }
    });

    // Add contextual recommendations
    if (context.recentNotices.length >= 2) {
      recommendations.push('Consider delaying notice generation due to recent notice activity');
    }

    if (context.loanAccount.outstandingAmount > context.systemConfiguration.highValueThreshold) {
      recommendations.push('High-value account - consider escalation to senior legal team');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * INITIALIZE VALIDATION RULES
   * Defines all business rules for trigger event validation
   */
  private initializeValidationRules(): void {
    this.validationRules = [
      // BUSINESS RULES
      {
        id: 'BR001',
        name: 'Minimum DPD Threshold',
        description: 'Account must meet minimum DPD threshold for notice generation',
        category: 'BUSINESS',
        severity: 'ERROR',
        isActive: true,
        validator: async (
          event: TriggerEvent,
          context: ValidationContext,
        ): Promise<ValidationResult> => {
          const minDpd = context.systemConfiguration.minDpdForNotice;
          const passed = event.dpdDays >= minDpd;

          return {
            ruleId: 'BR001',
            passed,
            severity: 'ERROR',
            message: passed
              ? `DPD ${event.dpdDays} meets minimum threshold of ${minDpd} days`
              : `DPD ${event.dpdDays} below minimum threshold of ${minDpd} days`,
            details: { currentDpd: event.dpdDays, minimumRequired: minDpd },
            recommendation: !passed
              ? 'Wait until account reaches minimum DPD threshold'
              : undefined,
          };
        },
      },

      {
        id: 'BR002',
        name: 'Duplicate Notice Prevention',
        description: 'Prevent duplicate notices within cooldown period',
        category: 'BUSINESS',
        severity: 'ERROR',
        isActive: true,
        validator: async (
          event: TriggerEvent,
          context: ValidationContext,
        ): Promise<ValidationResult> => {
          const cooldownDays = context.systemConfiguration.cooldownPeriodDays;
          const cooldownDate = new Date();
          cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

          const recentNotice = context.recentNotices.find(
            (notice) =>
              notice.dpdDays === event.dpdDays &&
              new Date(notice.noticeGenerationDate) > cooldownDate,
          );

          const passed = !recentNotice;

          return {
            ruleId: 'BR002',
            passed,
            severity: 'ERROR',
            message: passed
              ? `No duplicate notice found within ${cooldownDays}-day cooldown period`
              : `Duplicate notice exists for DPD ${event.dpdDays} within ${cooldownDays}-day cooldown period`,
            details: {
              cooldownPeriod: cooldownDays,
              lastNoticeDate: recentNotice?.noticeGenerationDate,
              conflictingNoticeCode: recentNotice?.noticeCode,
            },
            recommendation: !passed
              ? `Wait until ${new Date(recentNotice.noticeGenerationDate).toLocaleDateString()} + ${cooldownDays} days`
              : undefined,
          };
        },
      },

      {
        id: 'BR003',
        name: 'Maximum Notices Per Month',
        description: 'Limit number of notices per account per month',
        category: 'BUSINESS',
        severity: 'WARNING',
        isActive: true,
        validator: async (
          event: TriggerEvent,
          context: ValidationContext,
        ): Promise<ValidationResult> => {
          const maxNotices = context.systemConfiguration.maxNoticesPerMonth;
          const thisMonth = new Date();
          thisMonth.setDate(1); // First day of current month

          const monthlyNotices = context.recentNotices.filter(
            (notice) => new Date(notice.noticeGenerationDate) >= thisMonth,
          );

          const passed = monthlyNotices.length < maxNotices;

          return {
            ruleId: 'BR003',
            passed,
            severity: 'WARNING',
            message: passed
              ? `Monthly notice count (${monthlyNotices.length}) within limit of ${maxNotices}`
              : `Monthly notice count (${monthlyNotices.length}) exceeds limit of ${maxNotices}`,
            details: {
              currentMonthNotices: monthlyNotices.length,
              maximumAllowed: maxNotices,
              existingNotices: monthlyNotices.map((n) => n.noticeCode),
            },
            recommendation: !passed
              ? 'Consider consolidating notices or delaying until next month'
              : undefined,
          };
        },
      },

      // TECHNICAL RULES
      {
        id: 'TR001',
        name: 'Account Status Validation',
        description: 'Loan account must be active and in good standing',
        category: 'TECHNICAL',
        severity: 'ERROR',
        isActive: true,
        validator: async (
          event: TriggerEvent,
          context: ValidationContext,
        ): Promise<ValidationResult> => {
          const account = context.loanAccount;
          const validStatuses = ['Active', 'Overdue'];
          const passed = validStatuses.includes(account.status) && account.isActive;

          return {
            ruleId: 'TR001',
            passed,
            severity: 'ERROR',
            message: passed
              ? `Account status '${account.status}' is valid for notice generation`
              : `Account status '${account.status}' is not valid for notice generation`,
            details: {
              currentStatus: account.status,
              isActive: account.isActive,
              validStatuses,
            },
            recommendation: !passed ? 'Update account status before generating notices' : undefined,
          };
        },
      },

      {
        id: 'TR002',
        name: 'Product Type Validation',
        description: 'Validate product type eligibility for legal notices',
        category: 'TECHNICAL',
        severity: 'ERROR',
        isActive: true,
        validator: async (
          event: TriggerEvent,
          context: ValidationContext,
        ): Promise<ValidationResult> => {
          const account = context.loanAccount;
          const excludedTypes = context.systemConfiguration.excludedProductTypes;
          const passed = !excludedTypes.includes(account.productType);

          return {
            ruleId: 'TR002',
            passed,
            severity: 'ERROR',
            message: passed
              ? `Product type '${account.productType}' is eligible for legal notices`
              : `Product type '${account.productType}' is excluded from legal notices`,
            details: {
              productType: account.productType,
              excludedTypes,
            },
            recommendation: !passed
              ? 'Review product type configuration or handle via alternative process'
              : undefined,
          };
        },
      },

      // COMPLIANCE RULES
      {
        id: 'CR001',
        name: 'Business Hours Validation',
        description: 'Notices should be generated during business hours',
        category: 'COMPLIANCE',
        severity: 'WARNING',
        isActive: true,
        validator: async (
          event: TriggerEvent,
          context: ValidationContext,
        ): Promise<ValidationResult> => {
          if (!context.systemConfiguration.businessHoursOnly) {
            return {
              ruleId: 'CR001',
              passed: true,
              severity: 'INFO',
              message: 'Business hours validation disabled',
            };
          }

          const now = new Date();
          const hour = now.getHours();
          const day = now.getDay(); // 0 = Sunday, 6 = Saturday
          const isWeekend = day === 0 || day === 6;
          const isBusinessHours = hour >= 9 && hour <= 17;

          const passed = !isWeekend && isBusinessHours;

          return {
            ruleId: 'CR001',
            passed,
            severity: 'WARNING',
            message: passed
              ? 'Notice generation time is within business hours'
              : 'Notice generation time is outside business hours',
            details: {
              currentTime: now.toISOString(),
              isWeekend,
              currentHour: hour,
              businessHours: '9 AM - 5 PM',
            },
            recommendation: !passed
              ? 'Schedule notice generation for next business day'
              : undefined,
          };
        },
      },

      // RISK RULES
      {
        id: 'RR001',
        name: 'High Value Account Review',
        description: 'High-value accounts require additional review',
        category: 'RISK',
        severity: 'WARNING',
        isActive: true,
        validator: async (
          event: TriggerEvent,
          context: ValidationContext,
        ): Promise<ValidationResult> => {
          const threshold = context.systemConfiguration.highValueThreshold;
          const isHighValue = event.outstandingAmount >= threshold;

          return {
            ruleId: 'RR001',
            passed: true, // This is a warning, not a blocker
            severity: 'WARNING',
            message: isHighValue
              ? `High-value account (₹${event.outstandingAmount.toLocaleString()}) flagged for review`
              : `Standard value account (₹${event.outstandingAmount.toLocaleString()})`,
            details: {
              outstandingAmount: event.outstandingAmount,
              threshold,
              isHighValue,
            },
            recommendation: isHighValue
              ? 'Consider senior legal team review before notice generation'
              : undefined,
          };
        },
      },
    ];

    this.logger.log(`Initialized ${this.validationRules.length} validation rules`);
  }

  /**
   * GET VALIDATION STATISTICS
   */
  async getValidationStatistics(days: number = 7): Promise<any> {
    // This would typically query a validation_results table
    // For now, return simulated statistics
    return {
      period: `Last ${days} days`,
      totalValidations: 245,
      eligibleEvents: 189,
      ineligibleEvents: 34,
      pendingReview: 22,
      averageScore: 82.5,
      commonFailureReasons: [
        { reason: 'Duplicate notice within cooldown period', count: 18 },
        { reason: 'Account status invalid', count: 8 },
        { reason: 'Excluded product type', count: 5 },
        { reason: 'Outside business hours', count: 3 },
      ],
      rulePerformance: this.validationRules.map((rule) => ({
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        passRate: Math.random() * 100, // Simulated
        avgExecutionTime: Math.random() * 50, // Simulated (ms)
      })),
    };
  }

  /**
   * ENABLE/DISABLE VALIDATION RULE
   */
  updateValidationRule(ruleId: string, isActive: boolean): boolean {
    const rule = this.validationRules.find((r) => r.id === ruleId);
    if (rule) {
      rule.isActive = isActive;
      this.logger.log(`Validation rule ${ruleId} ${isActive ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  /**
   * GET ALL VALIDATION RULES
   */
  getValidationRules(): Omit<ValidationRule, 'validator'>[] {
    return this.validationRules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      severity: rule.severity,
      isActive: rule.isActive,
    }));
  }
}
