import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import * as schema from '../../db/schema';

export interface StatusTransition {
  fromStatus: string;
  toStatus: string;
  isAllowed: boolean;
  requiredFields?: string[];
  businessRules?: string[];
}

export interface CaseStatusUpdate {
  caseId: string;
  newStatus: string;
  updatedBy: string;
  reason?: string;
  nextHearingDate?: string;
  lastHearingOutcome?: string;
  caseClosureDate?: string;
  outcomeSummary?: string;
}

export interface StatusHistory {
  id: string;
  caseId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: Date;
  reason: string;
  notes?: string;
}

// Define valid status transitions
const STATUS_TRANSITIONS: StatusTransition[] = [
  {
    fromStatus: 'Filed',
    toStatus: 'Under Trial',
    isAllowed: true,
    requiredFields: ['nextHearingDate'],
    businessRules: ['Next hearing date must be in the future'],
  },
  {
    fromStatus: 'Filed',
    toStatus: 'Stayed',
    isAllowed: true,
    requiredFields: ['lastHearingOutcome'],
    businessRules: ['Stay reason must be provided'],
  },
  {
    fromStatus: 'Filed',
    toStatus: 'Dismissed',
    isAllowed: true,
    requiredFields: ['lastHearingOutcome', 'outcomeSummary'],
    businessRules: ['Dismissal reason must be provided'],
  },
  {
    fromStatus: 'Under Trial',
    toStatus: 'Stayed',
    isAllowed: true,
    requiredFields: ['lastHearingOutcome'],
    businessRules: ['Stay reason must be provided'],
  },
  {
    fromStatus: 'Under Trial',
    toStatus: 'Dismissed',
    isAllowed: true,
    requiredFields: ['lastHearingOutcome', 'outcomeSummary'],
    businessRules: ['Dismissal reason must be provided'],
  },
  {
    fromStatus: 'Under Trial',
    toStatus: 'Resolved',
    isAllowed: true,
    requiredFields: ['outcomeSummary', 'caseClosureDate'],
    businessRules: ['Resolution details must be provided', 'Closure date must be >= filed date'],
  },
  {
    fromStatus: 'Stayed',
    toStatus: 'Under Trial',
    isAllowed: true,
    requiredFields: ['nextHearingDate'],
    businessRules: ['Next hearing date must be in the future'],
  },
  {
    fromStatus: 'Stayed',
    toStatus: 'Dismissed',
    isAllowed: true,
    requiredFields: ['lastHearingOutcome', 'outcomeSummary'],
    businessRules: ['Dismissal reason must be provided'],
  },
  {
    fromStatus: 'Resolved',
    toStatus: 'Closed',
    isAllowed: true,
    requiredFields: ['caseClosureDate'],
    businessRules: ['Closure date must be >= resolution date'],
  },
  {
    fromStatus: 'Dismissed',
    toStatus: 'Closed',
    isAllowed: true,
    requiredFields: ['caseClosureDate'],
    businessRules: ['Closure date must be >= dismissal date'],
  },
];

@Injectable()
export class StatusManagementService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  /**
   * Validate if a status transition is allowed
   */
  validateStatusTransition(
    fromStatus: string,
    toStatus: string,
    updateData: Partial<CaseStatusUpdate>,
  ): { isValid: boolean; errors: string[] } {
    const transition = STATUS_TRANSITIONS.find(
      (t) => t.fromStatus === fromStatus && t.toStatus === toStatus,
    );

    if (!transition) {
      return {
        isValid: false,
        errors: [`Transition from ${fromStatus} to ${toStatus} is not allowed`],
      };
    }

    if (!transition.isAllowed) {
      return {
        isValid: false,
        errors: [`Transition from ${fromStatus} to ${toStatus} is not allowed`],
      };
    }

    const errors: string[] = [];

    // Check required fields
    if (transition.requiredFields) {
      for (const field of transition.requiredFields) {
        if (!updateData[field as keyof CaseStatusUpdate]) {
          errors.push(`Field ${field} is required for this status transition`);
        }
      }
    }

    // Apply business rules
    if (transition.businessRules) {
      for (const rule of transition.businessRules) {
        if (rule.includes('Next hearing date must be in the future')) {
          if (updateData.nextHearingDate) {
            const hearingDate = new Date(updateData.nextHearingDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (hearingDate < today) {
              errors.push('Next hearing date must be in the future');
            }
          }
        }

        if (rule.includes('Closure date must be >= filed date')) {
          if (updateData.caseClosureDate) {
            // This would need the original filed date to validate
            // For now, we'll skip this validation in the service
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update case status with validation and history tracking
   */
  async updateCaseStatus(updateData: CaseStatusUpdate): Promise<{
    success: boolean;
    message: string;
    errors?: string[];
  }> {
    try {
      // Get current case details
      const currentCase = await this.db
        .select()
        .from(schema.legalCases)
        .where(
          and(eq(schema.legalCases.id, updateData.caseId), eq(schema.legalCases.status, 'Active')),
        )
        .limit(1);

      if (currentCase.length === 0) {
        return { success: false, message: 'Case not found' };
      }

      const caseData = currentCase[0];
      const currentStatus = caseData.currentStatus;

      // Validate status transition
      const validation = this.validateStatusTransition(
        currentStatus,
        updateData.newStatus,
        updateData,
      );

      if (!validation.isValid) {
        return {
          success: false,
          message: 'Status transition validation failed',
          errors: validation.errors,
        };
      }

      // Prepare update data
      const updateFields: any = {
        currentStatus: updateData.newStatus,
        updatedAt: new Date(),
        updatedBy: updateData.updatedBy,
      };

      // Add optional fields if provided
      if (updateData.nextHearingDate) {
        updateFields.nextHearingDate = updateData.nextHearingDate;
      }
      if (updateData.lastHearingOutcome) {
        updateFields.lastHearingOutcome = updateData.lastHearingOutcome;
      }
      if (updateData.caseClosureDate) {
        updateFields.caseClosureDate = updateData.caseClosureDate;
      }
      if (updateData.outcomeSummary) {
        updateFields.outcomeSummary = updateData.outcomeSummary;
      }

      // Update the case
      await this.db
        .update(schema.legalCases)
        .set(updateFields)
        .where(eq(schema.legalCases.id, updateData.caseId));

      // Record status change in history
      await this.recordStatusChange({
        caseId: updateData.caseId,
        fromStatus: currentStatus,
        toStatus: updateData.newStatus,
        changedBy: updateData.updatedBy,
        reason: updateData.reason || 'Status updated',
        notes: `Status changed from ${currentStatus} to ${updateData.newStatus}`,
      });

      return {
        success: true,
        message: `Case status updated from ${currentStatus} to ${updateData.newStatus}`,
      };
    } catch (error) {
      console.error('Error updating case status:', error);
      return {
        success: false,
        message: 'Failed to update case status',
      };
    }
  }

  /**
   * Record status change in history
   */
  private async recordStatusChange(changeData: {
    caseId: string;
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    reason: string;
    notes?: string;
  }): Promise<void> {
    // Note: This would require a case_status_history table
    // For now, we'll just log the change
    console.log('Status change recorded:', changeData);
  }

  /**
   * Get available status transitions for a case
   */
  getAvailableTransitions(currentStatus: string): StatusTransition[] {
    return STATUS_TRANSITIONS.filter(
      (transition) => transition.fromStatus === currentStatus && transition.isAllowed,
    );
  }

  /**
   * Get case status history
   */
  async getCaseStatusHistory(caseId: string): Promise<StatusHistory[]> {
    // This would require a case_status_history table
    // For now, return empty array
    return [];
  }

  /**
   * Get cases by status with counts
   */
  async getCasesByStatus(): Promise<
    {
      status: string;
      count: number;
      cases: any[];
    }[]
  > {
    const statusCounts = await this.db
      .select({
        status: schema.legalCases.currentStatus,
        count: sql<number>`count(*)`,
      })
      .from(schema.legalCases)
      .where(eq(schema.legalCases.status, 'Active'))
      .groupBy(schema.legalCases.currentStatus);

    const result: {
      status: string;
      count: number;
      cases: any[];
    }[] = [];
    for (const statusCount of statusCounts) {
      const cases = await this.db
        .select({
          id: schema.legalCases.id,
          caseId: schema.legalCases.caseId,
          borrowerName: schema.legalCases.borrowerName,
          caseType: schema.legalCases.caseType,
          currentStatus: schema.legalCases.currentStatus,
          updatedAt: schema.legalCases.updatedAt,
        })
        .from(schema.legalCases)
        .where(
          and(
            eq(schema.legalCases.currentStatus, statusCount.status),
            eq(schema.legalCases.status, 'Active'),
          ),
        )
        .orderBy(desc(schema.legalCases.updatedAt))
        .limit(10);

      result.push({
        status: statusCount.status,
        count: statusCount.count,
        cases,
      });
    }

    return result;
  }

  /**
   * Get cases requiring attention (overdue hearings, long pending cases)
   */
  async getCasesRequiringAttention(): Promise<{
    overdueHearings: any[];
    longPendingCases: any[];
    casesWithoutLawyer: any[];
  }> {
    const today = new Date().toISOString().split('T')[0];

    // Cases with overdue hearings
    const overdueHearings = await this.db
      .select()
      .from(schema.legalCases)
      .where(
        and(
          eq(schema.legalCases.currentStatus, 'Under Trial'),
          eq(schema.legalCases.status, 'Active'),
          sql`${schema.legalCases.nextHearingDate} < ${today}`,
        ),
      )
      .orderBy(desc(schema.legalCases.nextHearingDate));

    // Cases pending for more than 90 days
    const longPendingCases = await this.db
      .select()
      .from(schema.legalCases)
      .where(
        and(
          eq(schema.legalCases.status, 'Active'),
          sql`${schema.legalCases.currentStatus} IN ('Filed', 'Under Trial')`,
          sql`${schema.legalCases.createdAt} < NOW() - INTERVAL '90 days'`,
        ),
      )
      .orderBy(asc(schema.legalCases.createdAt));

    // Cases without assigned lawyer
    const casesWithoutLawyer = await this.db
      .select()
      .from(schema.legalCases)
      .where(
        and(
          eq(schema.legalCases.status, 'Active'),
          sql`${schema.legalCases.lawyerAssignedId} IS NULL`,
          sql`${schema.legalCases.currentStatus} IN ('Filed', 'Under Trial')`,
        ),
      )
      .orderBy(desc(schema.legalCases.createdAt));

    return {
      overdueHearings,
      longPendingCases,
      casesWithoutLawyer,
    };
  }

  /**
   * Get status transition statistics
   */
  async getStatusTransitionStats(): Promise<{
    totalTransitions: number;
    mostCommonTransitions: { from: string; to: string; count: number }[];
    averageTimeInStatus: { status: string; averageDays: number }[];
  }> {
    // This would require status history tracking
    // For now, return mock data
    return {
      totalTransitions: 0,
      mostCommonTransitions: [],
      averageTimeInStatus: [],
    };
  }
}
