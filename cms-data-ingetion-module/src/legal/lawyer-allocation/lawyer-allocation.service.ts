import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { db } from '../../db/drizzle.config';
import { eq, and, desc, count, gte, lte, like, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { lawyerAllocations, legalCases, lawyers, users } from '../../db/schema';
import {
  CreateLawyerAllocationDto,
  UpdateLawyerAllocationDto,
  LawyerAllocationResponseDto,
  LawyerAllocationListResponseDto,
  LawyerAllocationFilterDto,
} from './dto';

@Injectable()
export class LawyerAllocationService {
  private readonly logger = new Logger(LawyerAllocationService.name);

  constructor(private readonly configService: ConfigService) {}

  // Create aliases for users table
  private readonly createdByUser = alias(users, 'createdByUser');
  private readonly updatedByUser = alias(users, 'updatedByUser');

  /**
   * Create a new lawyer allocation
   */
  async createAllocation(
    createDto: CreateLawyerAllocationDto,
  ): Promise<LawyerAllocationResponseDto> {
    try {
      // Step 1: Validate case exists and is in correct status
      const caseDetails = await this.validateCaseForAllocation(createDto.caseId);

      // Step 2: Validate lawyer exists and is available
      const lawyerDetails = await this.validateLawyerForAllocation(createDto.lawyerId);

      // Step 3: Check if case already has an active allocation
      await this.checkExistingAllocation(createDto.caseId);

      // Step 4: Generate allocation ID
      const allocationId = await this.generateAllocationId();

      // Step 5: Validate allocation date
      this.validateAllocationDate(createDto.allocationDate);

      // Step 6: Validate reassignment reason if reassignment flag is true
      if (createDto.reassignmentFlag && !createDto.reassignmentReason) {
        throw new BadRequestException(
          'Reassignment reason is mandatory when reassignment flag is true',
        );
      }

      // Step 7: Create allocation
      const [allocation] = await db
        .insert(lawyerAllocations)
        .values({
          allocationId,
          caseId: createDto.caseId,
          lawyerId: createDto.lawyerId,
          jurisdiction: createDto.jurisdiction,
          lawyerType: createDto.lawyerType,
          allocationDate: createDto.allocationDate,
          reassignmentFlag: createDto.reassignmentFlag || false,
          reassignmentReason: createDto.reassignmentReason,
          status: createDto.status || 'Active',
          lawyerAcknowledgement: createDto.lawyerAcknowledgement || false,
          remarks: createDto.remarks,
          createdBy: createDto.createdBy,
        })
        .returning();

      this.logger.log(`Lawyer allocation created: ${allocationId} for case ${createDto.caseId}`);

      // Step 8: Get allocation with related data
      return await this.getAllocationById(allocation.id);
    } catch (error) {
      this.logger.error(`Failed to create lawyer allocation:`, error);
      throw error;
    }
  }

  /**
   * Get allocation by ID with related data
   */
  async getAllocationById(id: string): Promise<LawyerAllocationResponseDto> {
    try {
      const [allocation] = await db
        .select({
          // Allocation fields
          id: lawyerAllocations.id,
          allocationId: lawyerAllocations.allocationId,
          caseId: lawyerAllocations.caseId,
          lawyerId: lawyerAllocations.lawyerId,
          jurisdiction: lawyerAllocations.jurisdiction,
          lawyerType: lawyerAllocations.lawyerType,
          allocationDate: lawyerAllocations.allocationDate,
          reassignmentFlag: lawyerAllocations.reassignmentFlag,
          reassignmentReason: lawyerAllocations.reassignmentReason,
          status: lawyerAllocations.status,
          lawyerAcknowledgement: lawyerAllocations.lawyerAcknowledgement,
          remarks: lawyerAllocations.remarks,
          createdAt: lawyerAllocations.createdAt,
          updatedAt: lawyerAllocations.updatedAt,
          createdBy: lawyerAllocations.createdBy,
          updatedBy: lawyerAllocations.updatedBy,
          // Case details
          caseCode: legalCases.caseId,
          loanAccountNumber: legalCases.loanAccountNumber,
          borrowerName: legalCases.borrowerName,
          caseType: legalCases.caseType,
          // Lawyer details
          lawyerName: lawyers.fullName,
          // User details for createdBy
          createdByUserName: this.createdByUser.fullName,
          // User details for updatedBy
          updatedByUserName: this.updatedByUser.fullName,
        })
        .from(lawyerAllocations)
        .leftJoin(legalCases, eq(lawyerAllocations.caseId, legalCases.id))
        .leftJoin(lawyers, eq(lawyerAllocations.lawyerId, lawyers.id))
        .leftJoin(this.createdByUser, eq(lawyerAllocations.createdBy, this.createdByUser.id))
        .leftJoin(this.updatedByUser, eq(lawyerAllocations.updatedBy, this.updatedByUser.id))
        .where(eq(lawyerAllocations.id, id))
        .limit(1);

      if (!allocation) {
        throw new NotFoundException(`Lawyer allocation with ID ${id} not found`);
      }

      return this.mapToResponseDto(allocation);
    } catch (error) {
      this.logger.error(`Failed to retrieve allocation by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get allocations with filtering and pagination
   */
  async getAllocations(
    filterDto: LawyerAllocationFilterDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<LawyerAllocationListResponseDto> {
    try {
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = this.buildWhereConditions(filterDto);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(lawyerAllocations)
        .where(whereConditions);

      const total = totalResult.count;

      // Get paginated results with related data
      const allocations = await db
        .select({
          // Allocation fields
          id: lawyerAllocations.id,
          allocationId: lawyerAllocations.allocationId,
          caseId: lawyerAllocations.caseId,
          lawyerId: lawyerAllocations.lawyerId,
          jurisdiction: lawyerAllocations.jurisdiction,
          lawyerType: lawyerAllocations.lawyerType,
          allocationDate: lawyerAllocations.allocationDate,
          reassignmentFlag: lawyerAllocations.reassignmentFlag,
          reassignmentReason: lawyerAllocations.reassignmentReason,
          status: lawyerAllocations.status,
          lawyerAcknowledgement: lawyerAllocations.lawyerAcknowledgement,
          remarks: lawyerAllocations.remarks,
          createdAt: lawyerAllocations.createdAt,
          updatedAt: lawyerAllocations.updatedAt,
          createdBy: lawyerAllocations.createdBy,
          updatedBy: lawyerAllocations.updatedBy,
          // Case details
          caseCode: legalCases.caseId,
          loanAccountNumber: legalCases.loanAccountNumber,
          borrowerName: legalCases.borrowerName,
          caseType: legalCases.caseType,
          // Lawyer details
          lawyerName: lawyers.fullName,
          // User details for createdBy
          createdByUserName: this.createdByUser.fullName,
          // User details for updatedBy
          updatedByUserName: this.updatedByUser.fullName,
        })
        .from(lawyerAllocations)
        .leftJoin(legalCases, eq(lawyerAllocations.caseId, legalCases.id))
        .leftJoin(lawyers, eq(lawyerAllocations.lawyerId, lawyers.id))
        .leftJoin(this.createdByUser, eq(lawyerAllocations.createdBy, this.createdByUser.id))
        .leftJoin(this.updatedByUser, eq(lawyerAllocations.updatedBy, this.updatedByUser.id))
        .where(whereConditions)
        .orderBy(desc(lawyerAllocations.createdAt))
        .limit(limit)
        .offset(offset);

      const data = allocations.map((allocation) => this.mapToResponseDto(allocation));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve allocations:`, error);
      throw error;
    }
  }

  /**
   * Update allocation
   */
  async updateAllocation(
    id: string,
    updateDto: UpdateLawyerAllocationDto,
  ): Promise<LawyerAllocationResponseDto> {
    try {
      // Check if allocation exists
      const existingAllocation = await this.getAllocationById(id);

      // Validate reassignment reason if reassignment flag is true
      if (updateDto.reassignmentFlag && !updateDto.reassignmentReason) {
        throw new BadRequestException(
          'Reassignment reason is mandatory when reassignment flag is true',
        );
      }

      // Update allocation
      const [updatedAllocation] = await db
        .update(lawyerAllocations)
        .set({
          jurisdiction: updateDto.jurisdiction || existingAllocation.jurisdiction,
          lawyerType: updateDto.lawyerType || existingAllocation.lawyerType,
          allocationDate: updateDto.allocationDate || existingAllocation.allocationDate,
          reassignmentFlag:
            updateDto.reassignmentFlag !== undefined
              ? updateDto.reassignmentFlag
              : existingAllocation.reassignmentFlag,
          reassignmentReason:
            updateDto.reassignmentReason !== undefined
              ? updateDto.reassignmentReason
              : existingAllocation.reassignmentReason,
          status:
            (updateDto.status as 'Active' | 'Inactive' | 'Reassigned') || existingAllocation.status,
          lawyerAcknowledgement:
            updateDto.lawyerAcknowledgement !== undefined
              ? updateDto.lawyerAcknowledgement
              : existingAllocation.lawyerAcknowledgement,
          remarks: updateDto.remarks !== undefined ? updateDto.remarks : existingAllocation.remarks,
          updatedBy: updateDto.updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(lawyerAllocations.id, id))
        .returning();

      this.logger.log(`Lawyer allocation updated: ${id}`);

      return await this.getAllocationById(id);
    } catch (error) {
      this.logger.error(`Failed to update allocation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete allocation
   */
  async deleteAllocation(id: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if allocation exists
      await this.getAllocationById(id);

      // Delete allocation
      await db.delete(lawyerAllocations).where(eq(lawyerAllocations.id, id));

      this.logger.log(`Lawyer allocation deleted: ${id}`);

      return { success: true, message: 'Lawyer allocation deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete allocation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get allocations by case ID
   */
  async getAllocationsByCaseId(caseId: string): Promise<LawyerAllocationResponseDto[]> {
    try {
      const allocations = await db
        .select({
          // Allocation fields
          id: lawyerAllocations.id,
          allocationId: lawyerAllocations.allocationId,
          caseId: lawyerAllocations.caseId,
          lawyerId: lawyerAllocations.lawyerId,
          jurisdiction: lawyerAllocations.jurisdiction,
          lawyerType: lawyerAllocations.lawyerType,
          allocationDate: lawyerAllocations.allocationDate,
          reassignmentFlag: lawyerAllocations.reassignmentFlag,
          reassignmentReason: lawyerAllocations.reassignmentReason,
          status: lawyerAllocations.status,
          lawyerAcknowledgement: lawyerAllocations.lawyerAcknowledgement,
          remarks: lawyerAllocations.remarks,
          createdAt: lawyerAllocations.createdAt,
          updatedAt: lawyerAllocations.updatedAt,
          createdBy: lawyerAllocations.createdBy,
          updatedBy: lawyerAllocations.updatedBy,
          // Case details
          caseCode: legalCases.caseId,
          loanAccountNumber: legalCases.loanAccountNumber,
          borrowerName: legalCases.borrowerName,
          caseType: legalCases.caseType,
          // Lawyer details
          lawyerName: lawyers.fullName,
          // User details for createdBy
          createdByUserName: this.createdByUser.fullName,
          // User details for updatedBy
          updatedByUserName: this.updatedByUser.fullName,
        })
        .from(lawyerAllocations)
        .leftJoin(legalCases, eq(lawyerAllocations.caseId, legalCases.id))
        .leftJoin(lawyers, eq(lawyerAllocations.lawyerId, lawyers.id))
        .leftJoin(this.createdByUser, eq(lawyerAllocations.createdBy, this.createdByUser.id))
        .leftJoin(this.updatedByUser, eq(lawyerAllocations.updatedBy, this.updatedByUser.id))
        .where(eq(lawyerAllocations.caseId, caseId))
        .orderBy(desc(lawyerAllocations.createdAt));

      return allocations.map((allocation) => this.mapToResponseDto(allocation));
    } catch (error) {
      this.logger.error(`Failed to retrieve allocations for case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Get allocations by lawyer ID
   */
  async getAllocationsByLawyerId(lawyerId: string): Promise<LawyerAllocationResponseDto[]> {
    try {
      const allocations = await db
        .select({
          // Allocation fields
          id: lawyerAllocations.id,
          allocationId: lawyerAllocations.allocationId,
          caseId: lawyerAllocations.caseId,
          lawyerId: lawyerAllocations.lawyerId,
          jurisdiction: lawyerAllocations.jurisdiction,
          lawyerType: lawyerAllocations.lawyerType,
          allocationDate: lawyerAllocations.allocationDate,
          reassignmentFlag: lawyerAllocations.reassignmentFlag,
          reassignmentReason: lawyerAllocations.reassignmentReason,
          status: lawyerAllocations.status,
          lawyerAcknowledgement: lawyerAllocations.lawyerAcknowledgement,
          remarks: lawyerAllocations.remarks,
          createdAt: lawyerAllocations.createdAt,
          updatedAt: lawyerAllocations.updatedAt,
          createdBy: lawyerAllocations.createdBy,
          updatedBy: lawyerAllocations.updatedBy,
          // Case details
          caseCode: legalCases.caseId,
          loanAccountNumber: legalCases.loanAccountNumber,
          borrowerName: legalCases.borrowerName,
          caseType: legalCases.caseType,
          // Lawyer details
          lawyerName: lawyers.fullName,
          // User details for createdBy
          createdByUserName: this.createdByUser.fullName,
          // User details for updatedBy
          updatedByUserName: this.updatedByUser.fullName,
        })
        .from(lawyerAllocations)
        .leftJoin(legalCases, eq(lawyerAllocations.caseId, legalCases.id))
        .leftJoin(lawyers, eq(lawyerAllocations.lawyerId, lawyers.id))
        .leftJoin(this.createdByUser, eq(lawyerAllocations.createdBy, this.createdByUser.id))
        .leftJoin(this.updatedByUser, eq(lawyerAllocations.updatedBy, this.updatedByUser.id))
        .where(eq(lawyerAllocations.lawyerId, lawyerId))
        .orderBy(desc(lawyerAllocations.createdAt));

      return allocations.map((allocation) => this.mapToResponseDto(allocation));
    } catch (error) {
      this.logger.error(`Failed to retrieve allocations for lawyer ${lawyerId}:`, error);
      throw error;
    }
  }

  /**
   * Validate case exists and is in correct status for allocation
   */
  private async validateCaseForAllocation(caseId: string): Promise<any> {
    const [caseDetails] = await db
      .select()
      .from(legalCases)
      .where(eq(legalCases.id, caseId))
      .limit(1);

    if (!caseDetails) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    // Check if case is in correct status for allocation
    if (!['Open', 'Filed'].includes(caseDetails.currentStatus)) {
      throw new BadRequestException(
        `Case must be in 'Open' or 'Filed' status for allocation. Current status: ${caseDetails.currentStatus}`,
      );
    }

    return caseDetails;
  }

  /**
   * Validate lawyer exists and is available for allocation
   */
  private async validateLawyerForAllocation(lawyerId: string): Promise<any> {
    const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.id, lawyerId)).limit(1);

    if (!lawyer) {
      throw new NotFoundException(`Lawyer with ID ${lawyerId} not found`);
    }

    if (!lawyer.isActive || !lawyer.isAvailable) {
      throw new BadRequestException('Lawyer is not active or available for allocation');
    }

    return lawyer;
  }

  /**
   * Check if case already has an active allocation
   */
  private async checkExistingAllocation(caseId: string): Promise<void> {
    const [existingAllocation] = await db
      .select()
      .from(lawyerAllocations)
      .where(and(eq(lawyerAllocations.caseId, caseId), eq(lawyerAllocations.status, 'Active')))
      .limit(1);

    if (existingAllocation) {
      throw new ConflictException('Case already has an active lawyer allocation');
    }
  }

  /**
   * Generate allocation ID in format LAW-YYYYMMDD-Sequence
   */
  private async generateAllocationId(): Promise<string> {
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `LAW-${dateString}`;

    // Get the next sequence number for today
    const [lastAllocation] = await db
      .select({ allocationId: lawyerAllocations.allocationId })
      .from(lawyerAllocations)
      .where(like(lawyerAllocations.allocationId, `${prefix}%`))
      .orderBy(desc(lawyerAllocations.allocationId))
      .limit(1);

    let sequence = 1;
    if (lastAllocation) {
      const lastSequence = parseInt(lastAllocation.allocationId.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Validate allocation date
   */
  private validateAllocationDate(allocationDate: string): void {
    // Parse the input date and normalize to YYYY-MM-DD format
    const inputDate = new Date(allocationDate + 'T00:00:00.000Z');
    const today = new Date();

    // Get today's date in YYYY-MM-DD format
    const todayStr = today.toISOString().split('T')[0];
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');

    this.logger.log(
      `Date validation - Input: ${allocationDate}, Today: ${todayStr}, Input Date: ${inputDate.toISOString()}, Today Date: ${todayDate.toISOString()}`,
    );

    // Compare dates (both normalized to UTC midnight)
    if (inputDate > todayDate) {
      this.logger.error(
        `Future date validation failed - Input: ${allocationDate}, Today: ${todayStr}`,
      );
      throw new BadRequestException('Allocation date cannot be a future date');
    }
  }

  /**
   * Build where conditions for filtering
   */
  private buildWhereConditions(filterDto: LawyerAllocationFilterDto): any {
    const conditions: any[] = [];

    if (filterDto.caseId) {
      conditions.push(eq(lawyerAllocations.caseId, filterDto.caseId));
    }

    if (filterDto.lawyerId) {
      conditions.push(eq(lawyerAllocations.lawyerId, filterDto.lawyerId));
    }

    if (filterDto.jurisdiction) {
      conditions.push(like(lawyerAllocations.jurisdiction, `%${filterDto.jurisdiction}%`));
    }

    if (filterDto.lawyerType) {
      conditions.push(eq(lawyerAllocations.lawyerType, filterDto.lawyerType));
    }

    if (filterDto.status) {
      conditions.push(
        eq(lawyerAllocations.status, filterDto.status as 'Active' | 'Inactive' | 'Reassigned'),
      );
    }

    if (filterDto.lawyerAcknowledgement !== undefined) {
      conditions.push(eq(lawyerAllocations.lawyerAcknowledgement, filterDto.lawyerAcknowledgement));
    }

    if (filterDto.reassignmentFlag !== undefined) {
      conditions.push(eq(lawyerAllocations.reassignmentFlag, filterDto.reassignmentFlag));
    }

    if (filterDto.allocationDateFrom) {
      conditions.push(gte(lawyerAllocations.allocationDate, filterDto.allocationDateFrom));
    }

    if (filterDto.allocationDateTo) {
      conditions.push(lte(lawyerAllocations.allocationDate, filterDto.allocationDateTo));
    }

    if (filterDto.searchRemarks) {
      conditions.push(like(lawyerAllocations.remarks, `%${filterDto.searchRemarks}%`));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Map database entity to response DTO
   */
  private mapToResponseDto(allocation: any): LawyerAllocationResponseDto {
    return {
      id: allocation.id,
      allocationId: allocation.allocationId,
      caseId: allocation.caseId,
      caseCode: allocation.caseCode || 'N/A',
      loanAccountNumber: allocation.loanAccountNumber || 'N/A',
      borrowerName: allocation.borrowerName || 'N/A',
      caseType: allocation.caseType || 'N/A',
      jurisdiction: allocation.jurisdiction,
      lawyerType: allocation.lawyerType,
      lawyerId: allocation.lawyerId,
      lawyerName: allocation.lawyerName || 'N/A',
      allocationDate:
        allocation.allocationDate instanceof Date
          ? allocation.allocationDate.toISOString().split('T')[0]
          : new Date(allocation.allocationDate).toISOString().split('T')[0],
      reassignmentFlag: allocation.reassignmentFlag,
      reassignmentReason: allocation.reassignmentReason,
      status: allocation.status,
      lawyerAcknowledgement: allocation.lawyerAcknowledgement,
      remarks: allocation.remarks,
      createdAt: allocation.createdAt,
      updatedAt: allocation.updatedAt,
      createdBy: allocation.createdByUserName || 'admin',
      updatedBy: allocation.updatedByUserName || 'admin',
    };
  }
}
