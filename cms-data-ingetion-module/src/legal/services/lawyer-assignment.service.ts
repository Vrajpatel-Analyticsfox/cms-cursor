import { Injectable } from '@nestjs/common';
import { db } from '../../db/drizzle.config';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { lawyers, caseAssignments, legalCases } from '../../db/schema';

export interface LawyerWorkload {
  lawyerId: string;
  lawyerCode: string;
  fullName: string;
  specialization: string;
  currentCases: number;
  maxCases: number;
  workloadPercentage: number;
  successRate: number;
  averageCaseDuration: number;
  isAvailable: boolean;
  jurisdiction: string;
  workloadScore: number; // Calculated score for assignment
}

export interface AssignmentCriteria {
  caseType: string;
  jurisdiction: string;
  specialization?: string;
  priority?: 'high' | 'medium' | 'low';
  excludeLawyerIds?: string[];
}

export interface AssignmentResult {
  assignedLawyer: LawyerWorkload | null;
  assignmentReason: string;
  workloadScore: number;
  alternatives: LawyerWorkload[];
}

@Injectable()
export class LawyerAssignmentService {
  constructor() {}

  /**
   * Get all available lawyers with their current workload
   */
  async getAvailableLawyers(): Promise<LawyerWorkload[]> {
    const lawyersData = await db
      .select({
        id: lawyers.id,
        lawyerCode: lawyers.lawyerCode,
        fullName: lawyers.fullName,
        specialization: lawyers.specialization,
        currentCases: lawyers.currentCases,
        maxCases: lawyers.maxCases,
        successRate: lawyers.successRate,
        averageCaseDuration: lawyers.averageCaseDuration,
        isAvailable: lawyers.isAvailable,
        jurisdiction: lawyers.jurisdiction,
      })
      .from(lawyers)
      .where(and(eq(lawyers.isActive, true), eq(lawyers.isAvailable, true)));

    return lawyersData.map((lawyer) => ({
      lawyerId: lawyer.id,
      ...lawyer,
      successRate: lawyer.successRate ? parseFloat(lawyer.successRate) : 0,
      averageCaseDuration: lawyer.averageCaseDuration || 0,
      workloadPercentage: (lawyer.currentCases / lawyer.maxCases) * 100,
      workloadScore: this.calculateWorkloadScore({
        currentCases: lawyer.currentCases,
        maxCases: lawyer.maxCases,
        successRate: lawyer.successRate ? parseFloat(lawyer.successRate) : 0,
        averageCaseDuration: lawyer.averageCaseDuration || 0,
      }),
    }));
  }

  /**
   * Find the best lawyer for a case based on criteria
   */
  async findBestLawyerForCase(criteria: AssignmentCriteria): Promise<AssignmentResult> {
    const availableLawyers = await this.getAvailableLawyers();

    // Filter lawyers based on criteria
    let filteredLawyers = availableLawyers.filter((lawyer) => {
      // Check if lawyer is not in exclude list
      if (criteria.excludeLawyerIds?.includes(lawyer.lawyerId)) {
        return false;
      }

      // Check jurisdiction match
      if (criteria.jurisdiction && !lawyer.jurisdiction.includes(criteria.jurisdiction)) {
        return false;
      }

      // Check specialization match (if specified)
      if (criteria.specialization && !lawyer.specialization.includes(criteria.specialization)) {
        return false;
      }

      // Check if lawyer has capacity
      if (lawyer.currentCases >= lawyer.maxCases) {
        return false;
      }

      return true;
    });

    if (filteredLawyers.length === 0) {
      return {
        assignedLawyer: null,
        assignmentReason: 'No available lawyers found matching the criteria',
        workloadScore: 0,
        alternatives: [],
      };
    }

    // Sort by workload score (lower is better for assignment)
    filteredLawyers.sort((a, b) => a.workloadScore - b.workloadScore);

    const assignedLawyer = filteredLawyers[0];
    const alternatives = filteredLawyers.slice(1, 4); // Top 3 alternatives

    let assignmentReason = `Assigned based on workload balance (${assignedLawyer.workloadPercentage.toFixed(1)}% capacity)`;

    if (
      criteria.specialization &&
      assignedLawyer.specialization.includes(criteria.specialization)
    ) {
      assignmentReason += ` and specialization match`;
    }

    if (assignedLawyer.successRate > 80) {
      assignmentReason += ` (High success rate: ${assignedLawyer.successRate}%)`;
    }

    return {
      assignedLawyer,
      assignmentReason,
      workloadScore: assignedLawyer.workloadScore,
      alternatives,
    };
  }

  /**
   * Assign a lawyer to a case
   */
  async assignLawyerToCase(
    caseId: string,
    lawyerId: string,
    assignedBy: string,
    assignmentReason?: string,
  ): Promise<{ success: boolean; message: string; assignmentId?: string }> {
    try {
      // Check if lawyer is available
      const lawyer = await db.select().from(lawyers).where(eq(lawyers.id, lawyerId)).limit(1);

      if (lawyer.length === 0) {
        return { success: false, message: 'Lawyer not found' };
      }

      if (!lawyer[0].isAvailable || lawyer[0].currentCases >= lawyer[0].maxCases) {
        return { success: false, message: 'Lawyer is not available or at capacity' };
      }

      // Check if case already has an active assignment
      const existingAssignment = await db
        .select()
        .from(caseAssignments)
        .where(and(eq(caseAssignments.caseId, caseId), eq(caseAssignments.isActive, true)))
        .limit(1);

      if (existingAssignment.length > 0) {
        return { success: false, message: 'Case already has an active lawyer assignment' };
      }

      // Create assignment
      const assignment = await db
        .insert(caseAssignments)
        .values({
          caseId,
          lawyerId,
          assignedBy,
          assignmentReason,
          workloadScore: '0.00', // Calculate workload score based on current cases and max cases
          createdBy: assignedBy,
        })
        .returning();

      // Update lawyer's current case count
      await db
        .update(lawyers)
        .set({
          currentCases: sql`${lawyers.currentCases} + 1`,
          updatedAt: new Date(),
          updatedBy: assignedBy,
        })
        .where(eq(lawyers.id, lawyerId));

      // Update legal case with assigned lawyer
      await db
        .update(legalCases)
        .set({
          lawyerAssignedId: lawyerId,
          updatedAt: new Date(),
          updatedBy: assignedBy,
        })
        .where(eq(legalCases.id, caseId));

      return {
        success: true,
        message: 'Lawyer assigned successfully',
        assignmentId: assignment[0].id,
      };
    } catch (error) {
      console.error('Error assigning lawyer to case:', error);
      return { success: false, message: 'Failed to assign lawyer to case' };
    }
  }

  /**
   * Reassign a case to a different lawyer
   */
  async reassignCase(
    caseId: string,
    newLawyerId: string,
    reassignedBy: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get current assignment
      const currentAssignment = await db
        .select()
        .from(caseAssignments)
        .where(and(eq(caseAssignments.caseId, caseId), eq(caseAssignments.isActive, true)))
        .limit(1);

      if (currentAssignment.length === 0) {
        return { success: false, message: 'No active assignment found for this case' };
      }

      const oldLawyerId = currentAssignment[0].lawyerId;

      // Deactivate current assignment
      await db
        .update(caseAssignments)
        .set({
          isActive: false,
          status: 'Reassigned',
          updatedAt: new Date(),
          updatedBy: reassignedBy,
        })
        .where(eq(caseAssignments.id, currentAssignment[0].id));

      // Decrease old lawyer's case count
      await db
        .update(lawyers)
        .set({
          currentCases: sql`${lawyers.currentCases} - 1`,
          updatedAt: new Date(),
          updatedBy: reassignedBy,
        })
        .where(eq(lawyers.id, oldLawyerId));

      // Assign to new lawyer
      const assignmentResult = await this.assignLawyerToCase(
        caseId,
        newLawyerId,
        reassignedBy,
        `Reassignment: ${reason}`,
      );

      if (!assignmentResult.success) {
        // Rollback: reactivate old assignment
        await db
          .update(caseAssignments)
          .set({
            isActive: true,
            status: 'Active',
            updatedAt: new Date(),
            updatedBy: reassignedBy,
          })
          .where(eq(caseAssignments.id, currentAssignment[0].id));

        // Restore old lawyer's case count
        await db
          .update(lawyers)
          .set({
            currentCases: sql`${lawyers.currentCases} + 1`,
            updatedAt: new Date(),
            updatedBy: reassignedBy,
          })
          .where(eq(lawyers.id, oldLawyerId));

        return assignmentResult;
      }

      return { success: true, message: 'Case reassigned successfully' };
    } catch (error) {
      console.error('Error reassigning case:', error);
      return { success: false, message: 'Failed to reassign case' };
    }
  }

  /**
   * Get lawyer workload statistics
   */
  async getLawyerWorkloadStats(): Promise<{
    totalLawyers: number;
    availableLawyers: number;
    averageWorkload: number;
    overloadedLawyers: number;
    underutilizedLawyers: number;
  }> {
    const stats = await db
      .select({
        total: count(),
        available: sql<number>`count(case when ${lawyers.isAvailable} = true then 1 end)`,
        averageWorkload: sql<number>`avg(${lawyers.currentCases}::float / ${lawyers.maxCases}::float * 100)`,
        overloaded: sql<number>`count(case when ${lawyers.currentCases} >= ${lawyers.maxCases} then 1 end)`,
        underutilized: sql<number>`count(case when ${lawyers.currentCases} < ${lawyers.maxCases} * 0.5 then 1 end)`,
      })
      .from(lawyers)
      .where(eq(lawyers.isActive, true));

    return {
      totalLawyers: stats[0].total,
      availableLawyers: stats[0].available,
      averageWorkload: Number(stats[0].averageWorkload) || 0,
      overloadedLawyers: stats[0].overloaded,
      underutilizedLawyers: stats[0].underutilized,
    };
  }

  /**
   * Calculate workload score for a lawyer (lower is better for assignment)
   */
  private calculateWorkloadScore(lawyer: {
    currentCases: number;
    maxCases: number;
    successRate: number;
    averageCaseDuration: number;
  }): number {
    const workloadPercentage = (lawyer.currentCases / lawyer.maxCases) * 100;

    // Base score from workload percentage (0-100)
    let score = workloadPercentage;

    // Adjust for success rate (higher success rate = lower score)
    const successRateAdjustment = (100 - (lawyer.successRate || 0)) * 0.1;
    score += successRateAdjustment;

    // Adjust for case duration (shorter duration = lower score)
    const durationAdjustment = (lawyer.averageCaseDuration || 0) * 0.01;
    score += durationAdjustment;

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get case assignments for a lawyer
   */
  async getLawyerAssignments(lawyerId: string): Promise<any[]> {
    return await db
      .select({
        assignmentId: caseAssignments.id,
        caseId: legalCases.id,
        caseCode: legalCases.caseId,
        caseType: legalCases.caseType,
        borrowerName: legalCases.borrowerName,
        currentStatus: legalCases.currentStatus,
        assignedAt: caseAssignments.assignedAt,
        assignmentReason: caseAssignments.assignmentReason,
        status: caseAssignments.status,
      })
      .from(caseAssignments)
      .innerJoin(legalCases, eq(caseAssignments.caseId, legalCases.id))
      .where(and(eq(caseAssignments.lawyerId, lawyerId), eq(caseAssignments.isActive, true)))
      .orderBy(desc(caseAssignments.assignedAt));
  }
}
