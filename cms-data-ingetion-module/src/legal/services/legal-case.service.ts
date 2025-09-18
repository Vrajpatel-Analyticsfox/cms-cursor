import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, like, count, SQL } from 'drizzle-orm';
import { db } from '../../db/drizzle.config';
import { legalCases, lawyers } from '../../db/schema';
import { CreateLegalCaseDto } from '../dto/create-legal-case.dto';
import { UpdateLegalCaseDto } from '../dto/update-legal-case.dto';
import { LegalCaseResponseDto, LegalCaseListResponseDto } from '../dto/legal-case-response.dto';
import { CaseIdService } from '../case-id.service';
import { DataIngestionHelperService } from './data-ingestion-helper.service';

@Injectable()
export class LegalCaseService {
  private readonly logger = new Logger(LegalCaseService.name);

  constructor(
    private readonly caseIdService: CaseIdService,
    private readonly dataIngestionHelper: DataIngestionHelperService,
  ) {}

  /**
   * Create a new legal case
   */
  async createLegalCase(
    createDto: CreateLegalCaseDto,
    createdBy: string,
  ): Promise<LegalCaseResponseDto> {
    try {
      // Validate loan account exists and get borrower data
      const borrowerData = await this.dataIngestionHelper.getBorrowerData(
        createDto.loanAccountNumber,
      );

      // Generate case ID
      const caseIdResult = await this.caseIdService.generateCaseId({
        prefix: 'LC',
        categoryCode: undefined,
        createdBy,
      });

      if (!caseIdResult.success) {
        throw new BadRequestException(`Failed to generate case ID: ${caseIdResult.message}`);
      }

      // Validate lawyer assignment if provided
      if (createDto.lawyerAssignedId) {
        const lawyer = await db
          .select()
          .from(lawyers)
          .where(eq(lawyers.id, createDto.lawyerAssignedId))
          .limit(1);

        if (lawyer.length === 0) {
          throw new BadRequestException(`Lawyer with ID ${createDto.lawyerAssignedId} not found`);
        }
      }

      // Validate case filed date is not in the future
      const caseFiledDate = new Date(createDto.caseFiledDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (caseFiledDate > today) {
        throw new BadRequestException('Case filed date cannot be in the future');
      }

      // Validate case closure date if provided
      if (createDto.caseClosureDate) {
        const caseClosureDate = new Date(createDto.caseClosureDate);
        if (caseClosureDate < caseFiledDate) {
          throw new BadRequestException(
            'Case closure date must be greater than or equal to case filed date',
          );
        }
      }

      // Helper function to convert empty strings to null for date fields
      const sanitizeDateField = (value: string | undefined | null): string | null => {
        if (!value || value.trim() === '') {
          return null;
        }
        return value;
      };

      // Create the legal case
      const newCase = await db
        .insert(legalCases)
        .values({
          caseId: caseIdResult.caseId,
          loanAccountNumber: createDto.loanAccountNumber,
          borrowerName: borrowerData.borrowerName,
          caseType: createDto.caseType,
          courtName: createDto.courtName,
          caseFiledDate: createDto.caseFiledDate,
          lawyerAssignedId: createDto.lawyerAssignedId,
          filingJurisdiction: createDto.filingJurisdiction,
          currentStatus: createDto.currentStatus || 'Filed',
          nextHearingDate: sanitizeDateField(createDto.nextHearingDate),
          lastHearingOutcome: createDto.lastHearingOutcome || null,
          recoveryActionLinked: createDto.recoveryActionLinked || null,
          caseRemarks: createDto.caseRemarks || null,
          caseClosureDate: sanitizeDateField(createDto.caseClosureDate),
          outcomeSummary: createDto.outcomeSummary || null,
          createdBy,
        })
        .returning();

      this.logger.log(
        `Created legal case: ${caseIdResult.caseId} for loan account: ${createDto.loanAccountNumber}`,
      );

      return this.mapToResponseDto(newCase[0]);
    } catch (error) {
      this.logger.error('Error creating legal case:', error);
      throw error;
    }
  }

  /**
   * Get legal case by ID
   */
  async getLegalCaseById(id: string): Promise<LegalCaseResponseDto> {
    try {
      const legalCase = await db
        .select({
          id: legalCases.id,
          caseId: legalCases.caseId,
          loanAccountNumber: legalCases.loanAccountNumber,
          borrowerName: legalCases.borrowerName,
          caseType: legalCases.caseType,
          courtName: legalCases.courtName,
          caseFiledDate: legalCases.caseFiledDate,
          lawyerAssignedId: legalCases.lawyerAssignedId,
          filingJurisdiction: legalCases.filingJurisdiction,
          currentStatus: legalCases.currentStatus,
          nextHearingDate: legalCases.nextHearingDate,
          lastHearingOutcome: legalCases.lastHearingOutcome,
          recoveryActionLinked: legalCases.recoveryActionLinked,
          createdBy: legalCases.createdBy,
          caseRemarks: legalCases.caseRemarks,
          caseClosureDate: legalCases.caseClosureDate,
          outcomeSummary: legalCases.outcomeSummary,
          createdAt: legalCases.createdAt,
          updatedAt: legalCases.updatedAt,
          updatedBy: legalCases.updatedBy,
          lawyerName: lawyers.fullName,
        })
        .from(legalCases)
        .leftJoin(lawyers, eq(legalCases.lawyerAssignedId, lawyers.id))
        .where(and(eq(legalCases.id, id), eq(legalCases.status, 'Active')))
        .limit(1);

      if (legalCase.length === 0) {
        throw new NotFoundException(`Legal case with ID ${id} not found`);
      }

      return this.mapToResponseDtoWithLawyer(legalCase[0]);
    } catch (error) {
      this.logger.error(`Error getting legal case by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get legal case by case ID
   */
  async getLegalCaseByCaseId(caseId: string): Promise<LegalCaseResponseDto> {
    try {
      const legalCase = await db
        .select({
          id: legalCases.id,
          caseId: legalCases.caseId,
          loanAccountNumber: legalCases.loanAccountNumber,
          borrowerName: legalCases.borrowerName,
          caseType: legalCases.caseType,
          courtName: legalCases.courtName,
          caseFiledDate: legalCases.caseFiledDate,
          lawyerAssignedId: legalCases.lawyerAssignedId,
          filingJurisdiction: legalCases.filingJurisdiction,
          currentStatus: legalCases.currentStatus,
          nextHearingDate: legalCases.nextHearingDate,
          lastHearingOutcome: legalCases.lastHearingOutcome,
          recoveryActionLinked: legalCases.recoveryActionLinked,
          createdBy: legalCases.createdBy,
          caseRemarks: legalCases.caseRemarks,
          caseClosureDate: legalCases.caseClosureDate,
          outcomeSummary: legalCases.outcomeSummary,
          createdAt: legalCases.createdAt,
          updatedAt: legalCases.updatedAt,
          updatedBy: legalCases.updatedBy,
          lawyerName: lawyers.fullName,
        })
        .from(legalCases)
        .leftJoin(lawyers, eq(legalCases.lawyerAssignedId, lawyers.id))
        .where(and(eq(legalCases.caseId, caseId), eq(legalCases.status, 'Active')))
        .limit(1);

      if (legalCase.length === 0) {
        throw new NotFoundException(`Legal case with case ID ${caseId} not found`);
      }

      return this.mapToResponseDtoWithLawyer(legalCase[0]);
    } catch (error) {
      this.logger.error(`Error getting legal case by case ID ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Get all legal cases with pagination and filters
   */
  async getLegalCases(
    page: number = 1,
    limit: number = 10,
    filters?: {
      caseType?: string;
      currentStatus?: string;
      lawyerAssignedId?: string;
      loanAccountNumber?: string;
      borrowerName?: string;
    },
  ): Promise<LegalCaseListResponseDto> {
    try {
      const offset = (page - 1) * limit;
      const whereConditions: SQL[] = [];

      // Always filter out deleted cases
      whereConditions.push(eq(legalCases.status, 'Active'));

      // Apply filters
      if (filters?.caseType) {
        whereConditions.push(eq(legalCases.caseType, filters.caseType as any));
      }
      if (filters?.currentStatus) {
        whereConditions.push(eq(legalCases.currentStatus, filters.currentStatus as any));
      }
      if (filters?.lawyerAssignedId) {
        whereConditions.push(eq(legalCases.lawyerAssignedId, filters.lawyerAssignedId));
      }
      if (filters?.loanAccountNumber) {
        whereConditions.push(like(legalCases.loanAccountNumber, `%${filters.loanAccountNumber}%`));
      }
      if (filters?.borrowerName) {
        whereConditions.push(like(legalCases.borrowerName, `%${filters.borrowerName}%`));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const totalResult = await db.select({ count: count() }).from(legalCases).where(whereClause);

      const total = totalResult[0].count;

      // Get paginated results
      const legalCasesList = await db
        .select({
          id: legalCases.id,
          caseId: legalCases.caseId,
          loanAccountNumber: legalCases.loanAccountNumber,
          borrowerName: legalCases.borrowerName,
          caseType: legalCases.caseType,
          courtName: legalCases.courtName,
          caseFiledDate: legalCases.caseFiledDate,
          lawyerAssignedId: legalCases.lawyerAssignedId,
          filingJurisdiction: legalCases.filingJurisdiction,
          currentStatus: legalCases.currentStatus,
          nextHearingDate: legalCases.nextHearingDate,
          lastHearingOutcome: legalCases.lastHearingOutcome,
          recoveryActionLinked: legalCases.recoveryActionLinked,
          createdBy: legalCases.createdBy,
          caseRemarks: legalCases.caseRemarks,
          caseClosureDate: legalCases.caseClosureDate,
          outcomeSummary: legalCases.outcomeSummary,
          createdAt: legalCases.createdAt,
          updatedAt: legalCases.updatedAt,
          updatedBy: legalCases.updatedBy,
          lawyerName: lawyers.fullName,
        })
        .from(legalCases)
        .leftJoin(lawyers, eq(legalCases.lawyerAssignedId, lawyers.id))
        .where(whereClause)
        .orderBy(desc(legalCases.createdAt))
        .limit(limit)
        .offset(offset);

      const cases = legalCasesList.map((case_) => this.mapToResponseDtoWithLawyer(case_));

      return {
        cases,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error getting legal cases:', error);
      throw error;
    }
  }

  /**
   * Update legal case
   */
  async updateLegalCase(
    id: string,
    updateDto: UpdateLegalCaseDto,
    updatedBy: string,
  ): Promise<LegalCaseResponseDto> {
    try {
      // Check if case exists and is active
      const existingCase = await db
        .select()
        .from(legalCases)
        .where(and(eq(legalCases.id, id), eq(legalCases.status, 'Active')))
        .limit(1);

      if (existingCase.length === 0) {
        throw new NotFoundException(`Legal case with ID ${id} not found`);
      }

      // Validate lawyer assignment if provided
      if (updateDto.lawyerAssignedId) {
        const lawyer = await db
          .select()
          .from(lawyers)
          .where(eq(lawyers.id, updateDto.lawyerAssignedId))
          .limit(1);

        if (lawyer.length === 0) {
          throw new BadRequestException(`Lawyer with ID ${updateDto.lawyerAssignedId} not found`);
        }
      }

      // Validate case filed date if provided
      if (updateDto.caseFiledDate) {
        const caseFiledDate = new Date(updateDto.caseFiledDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (caseFiledDate > today) {
          throw new BadRequestException('Case filed date cannot be in the future');
        }
      }

      // Validate case closure date if provided
      if (updateDto.caseClosureDate) {
        const caseClosureDate = new Date(updateDto.caseClosureDate);
        const caseFiledDate = new Date(updateDto.caseFiledDate || existingCase[0].caseFiledDate);

        if (caseClosureDate < caseFiledDate) {
          throw new BadRequestException(
            'Case closure date must be greater than or equal to case filed date',
          );
        }
      }

      // Helper function to convert empty strings to null for date fields
      const sanitizeDateField = (value: string | undefined | null): string | null => {
        if (!value || value.trim() === '') {
          return null;
        }
        return value;
      };

      // Prepare update data with proper null handling
      const updateData: any = {
        ...updateDto,
        updatedAt: new Date(),
        updatedBy,
      };

      // Sanitize date fields
      if (updateDto.nextHearingDate !== undefined) {
        updateData.nextHearingDate = sanitizeDateField(updateDto.nextHearingDate);
      }
      if (updateDto.caseClosureDate !== undefined) {
        updateData.caseClosureDate = sanitizeDateField(updateDto.caseClosureDate);
      }

      // Sanitize text fields to null if empty
      if (updateDto.lastHearingOutcome !== undefined) {
        updateData.lastHearingOutcome = updateDto.lastHearingOutcome || null;
      }
      if (updateDto.recoveryActionLinked !== undefined) {
        updateData.recoveryActionLinked = updateDto.recoveryActionLinked || null;
      }
      if (updateDto.caseRemarks !== undefined) {
        updateData.caseRemarks = updateDto.caseRemarks || null;
      }
      if (updateDto.outcomeSummary !== undefined) {
        updateData.outcomeSummary = updateDto.outcomeSummary || null;
      }

      // Update the legal case
      const updatedCase = await db
        .update(legalCases)
        .set(updateData)
        .where(eq(legalCases.id, id))
        .returning();

      this.logger.log(`Updated legal case: ${updatedCase[0].caseId}`);

      return this.mapToResponseDto(updatedCase[0]);
    } catch (error) {
      this.logger.error(`Error updating legal case ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update case status
   */
  async updateCaseStatus(
    id: string,
    status: 'Filed' | 'Under Trial' | 'Stayed' | 'Dismissed' | 'Resolved' | 'Closed',
    updatedBy: string,
    caseClosureDate?: string,
    outcomeSummary?: string,
  ): Promise<LegalCaseResponseDto> {
    try {
      const updateData: any = {
        currentStatus: status,
        updatedAt: new Date(),
        updatedBy,
      };

      if (caseClosureDate) {
        updateData.caseClosureDate = caseClosureDate.trim() === '' ? null : caseClosureDate;
      }

      if (outcomeSummary) {
        updateData.outcomeSummary = outcomeSummary;
      }

      const updatedCase = await db
        .update(legalCases)
        .set(updateData)
        .where(eq(legalCases.id, id))
        .returning();

      if (updatedCase.length === 0) {
        throw new NotFoundException(`Legal case with ID ${id} not found`);
      }

      this.logger.log(`Updated case status for ${updatedCase[0].caseId} to ${status}`);

      return this.mapToResponseDto(updatedCase[0]);
    } catch (error) {
      this.logger.error(`Error updating case status for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete legal case (soft delete)
   */
  async deleteLegalCase(
    id: string,
    deletedBy: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const existingCase = await db
        .select()
        .from(legalCases)
        .where(and(eq(legalCases.id, id), eq(legalCases.status, 'Active')))
        .limit(1);

      if (existingCase.length === 0) {
        throw new NotFoundException(`Legal case with ID ${id} not found`);
      }

      // Soft delete by setting status to 'deleted'
      await db
        .update(legalCases)
        .set({
          status: 'Inactive',
          updatedAt: new Date(),
          updatedBy: `${deletedBy}-DELETED`,
        })
        .where(eq(legalCases.id, id));

      this.logger.log(`Deleted legal case: ${existingCase[0].caseId}`);

      return {
        success: true,
        message: `Legal case ${existingCase[0].caseId} has been deleted successfully`,
      };
    } catch (error) {
      this.logger.error(`Error deleting legal case ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get cases by status
   */
  async getCasesByStatus(status: string): Promise<LegalCaseResponseDto[]> {
    try {
      const legalCasesList = await db
        .select({
          id: legalCases.id,
          caseId: legalCases.caseId,
          loanAccountNumber: legalCases.loanAccountNumber,
          borrowerName: legalCases.borrowerName,
          caseType: legalCases.caseType,
          courtName: legalCases.courtName,
          caseFiledDate: legalCases.caseFiledDate,
          lawyerAssignedId: legalCases.lawyerAssignedId,
          filingJurisdiction: legalCases.filingJurisdiction,
          currentStatus: legalCases.currentStatus,
          nextHearingDate: legalCases.nextHearingDate,
          lastHearingOutcome: legalCases.lastHearingOutcome,
          recoveryActionLinked: legalCases.recoveryActionLinked,
          createdBy: legalCases.createdBy,
          caseRemarks: legalCases.caseRemarks,
          caseClosureDate: legalCases.caseClosureDate,
          outcomeSummary: legalCases.outcomeSummary,
          createdAt: legalCases.createdAt,
          updatedAt: legalCases.updatedAt,
          updatedBy: legalCases.updatedBy,
          lawyerName: lawyers.fullName,
        })
        .from(legalCases)
        .leftJoin(lawyers, eq(legalCases.lawyerAssignedId, lawyers.id))
        .where(and(eq(legalCases.currentStatus, status as any), eq(legalCases.status, 'Active')))
        .orderBy(desc(legalCases.createdAt));

      return legalCasesList.map((case_) => this.mapToResponseDtoWithLawyer(case_));
    } catch (error) {
      this.logger.error(`Error getting cases by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get cases by lawyer
   */
  async getCasesByLawyer(lawyerId: string): Promise<LegalCaseResponseDto[]> {
    try {
      const legalCasesList = await db
        .select({
          id: legalCases.id,
          caseId: legalCases.caseId,
          loanAccountNumber: legalCases.loanAccountNumber,
          borrowerName: legalCases.borrowerName,
          caseType: legalCases.caseType,
          courtName: legalCases.courtName,
          caseFiledDate: legalCases.caseFiledDate,
          lawyerAssignedId: legalCases.lawyerAssignedId,
          filingJurisdiction: legalCases.filingJurisdiction,
          currentStatus: legalCases.currentStatus,
          nextHearingDate: legalCases.nextHearingDate,
          lastHearingOutcome: legalCases.lastHearingOutcome,
          recoveryActionLinked: legalCases.recoveryActionLinked,
          createdBy: legalCases.createdBy,
          caseRemarks: legalCases.caseRemarks,
          caseClosureDate: legalCases.caseClosureDate,
          outcomeSummary: legalCases.outcomeSummary,
          createdAt: legalCases.createdAt,
          updatedAt: legalCases.updatedAt,
          updatedBy: legalCases.updatedBy,
          lawyerName: lawyers.fullName,
        })
        .from(legalCases)
        .leftJoin(lawyers, eq(legalCases.lawyerAssignedId, lawyers.id))
        .where(and(eq(legalCases.lawyerAssignedId, lawyerId), eq(legalCases.status, 'Active')))
        .orderBy(desc(legalCases.createdAt));

      return legalCasesList.map((case_) => this.mapToResponseDtoWithLawyer(case_));
    } catch (error) {
      this.logger.error(`Error getting cases by lawyer ${lawyerId}:`, error);
      throw error;
    }
  }

  /**
   * Map database record to response DTO
   */
  private mapToResponseDto(case_: any): LegalCaseResponseDto {
    return {
      id: case_.id,
      caseId: case_.caseId,
      loanAccountNumber: case_.loanAccountNumber,
      borrowerName: case_.borrowerName,
      caseType: case_.caseType,
      courtName: case_.courtName,
      caseFiledDate: case_.caseFiledDate,
      lawyerAssignedId: case_.lawyerAssignedId,
      filingJurisdiction: case_.filingJurisdiction,
      currentStatus: case_.currentStatus,
      nextHearingDate: case_.nextHearingDate,
      lastHearingOutcome: case_.lastHearingOutcome,
      recoveryActionLinked: case_.recoveryActionLinked,
      createdBy: case_.createdBy,
      caseRemarks: case_.caseRemarks,
      caseClosureDate: case_.caseClosureDate,
      outcomeSummary: case_.outcomeSummary,
      createdAt: case_.createdAt?.toISOString(),
      updatedAt: case_.updatedAt?.toISOString(),
      updatedBy: case_.updatedBy,
    };
  }

  /**
   * Map database record with lawyer info to response DTO
   */
  private mapToResponseDtoWithLawyer(case_: any): LegalCaseResponseDto {
    const response = this.mapToResponseDto(case_);
    response.lawyerName = case_.lawyerName;
    return response;
  }
}
