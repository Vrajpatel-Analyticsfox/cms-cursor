import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, like, count, SQL } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { CreateLegalCaseDto } from '../dto/create-legal-case.dto';
import { UpdateLegalCaseDto } from '../dto/update-legal-case.dto';
import { LegalCaseResponseDto, LegalCaseListResponseDto } from '../dto/legal-case-response.dto';
import { CaseIdService } from '../case-id.service';
import { DataIngestionHelperService } from './data-ingestion-helper.service';

@Injectable()
export class LegalCaseService {
  private readonly logger = new Logger(LegalCaseService.name);

  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
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
        const lawyer = await this.db
          .select()
          .from(schema.lawyers)
          .where(eq(schema.lawyers.id, createDto.lawyerAssignedId))
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

      // Create the legal case
      const newCase = await this.db
        .insert(schema.legalCases)
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
          nextHearingDate: createDto.nextHearingDate,
          lastHearingOutcome: createDto.lastHearingOutcome,
          recoveryActionLinked: createDto.recoveryActionLinked,
          caseRemarks: createDto.caseRemarks,
          caseClosureDate: createDto.caseClosureDate,
          outcomeSummary: createDto.outcomeSummary,
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
      const legalCase = await this.db
        .select({
          id: schema.legalCases.id,
          caseId: schema.legalCases.caseId,
          loanAccountNumber: schema.legalCases.loanAccountNumber,
          borrowerName: schema.legalCases.borrowerName,
          caseType: schema.legalCases.caseType,
          courtName: schema.legalCases.courtName,
          caseFiledDate: schema.legalCases.caseFiledDate,
          lawyerAssignedId: schema.legalCases.lawyerAssignedId,
          filingJurisdiction: schema.legalCases.filingJurisdiction,
          currentStatus: schema.legalCases.currentStatus,
          nextHearingDate: schema.legalCases.nextHearingDate,
          lastHearingOutcome: schema.legalCases.lastHearingOutcome,
          recoveryActionLinked: schema.legalCases.recoveryActionLinked,
          createdBy: schema.legalCases.createdBy,
          caseRemarks: schema.legalCases.caseRemarks,
          caseClosureDate: schema.legalCases.caseClosureDate,
          outcomeSummary: schema.legalCases.outcomeSummary,
          createdAt: schema.legalCases.createdAt,
          updatedAt: schema.legalCases.updatedAt,
          updatedBy: schema.legalCases.updatedBy,
          lawyerName: schema.lawyers.fullName,
        })
        .from(schema.legalCases)
        .leftJoin(schema.lawyers, eq(schema.legalCases.lawyerAssignedId, schema.lawyers.id))
        .where(eq(schema.legalCases.id, id))
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
      const legalCase = await this.db
        .select({
          id: schema.legalCases.id,
          caseId: schema.legalCases.caseId,
          loanAccountNumber: schema.legalCases.loanAccountNumber,
          borrowerName: schema.legalCases.borrowerName,
          caseType: schema.legalCases.caseType,
          courtName: schema.legalCases.courtName,
          caseFiledDate: schema.legalCases.caseFiledDate,
          lawyerAssignedId: schema.legalCases.lawyerAssignedId,
          filingJurisdiction: schema.legalCases.filingJurisdiction,
          currentStatus: schema.legalCases.currentStatus,
          nextHearingDate: schema.legalCases.nextHearingDate,
          lastHearingOutcome: schema.legalCases.lastHearingOutcome,
          recoveryActionLinked: schema.legalCases.recoveryActionLinked,
          createdBy: schema.legalCases.createdBy,
          caseRemarks: schema.legalCases.caseRemarks,
          caseClosureDate: schema.legalCases.caseClosureDate,
          outcomeSummary: schema.legalCases.outcomeSummary,
          createdAt: schema.legalCases.createdAt,
          updatedAt: schema.legalCases.updatedAt,
          updatedBy: schema.legalCases.updatedBy,
          lawyerName: schema.lawyers.fullName,
        })
        .from(schema.legalCases)
        .leftJoin(schema.lawyers, eq(schema.legalCases.lawyerAssignedId, schema.lawyers.id))
        .where(eq(schema.legalCases.caseId, caseId))
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
      let whereConditions: SQL[] = [];

      // Apply filters
      if (filters?.caseType) {
        whereConditions.push(eq(schema.legalCases.caseType, filters.caseType as any));
      }
      if (filters?.currentStatus) {
        whereConditions.push(eq(schema.legalCases.currentStatus, filters.currentStatus as any));
      }
      if (filters?.lawyerAssignedId) {
        whereConditions.push(eq(schema.legalCases.lawyerAssignedId, filters.lawyerAssignedId));
      }
      if (filters?.loanAccountNumber) {
        whereConditions.push(
          like(schema.legalCases.loanAccountNumber, `%${filters.loanAccountNumber}%`),
        );
      }
      if (filters?.borrowerName) {
        whereConditions.push(like(schema.legalCases.borrowerName, `%${filters.borrowerName}%`));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(schema.legalCases)
        .where(whereClause);

      const total = totalResult[0].count;

      // Get paginated results
      const legalCases = await this.db
        .select({
          id: schema.legalCases.id,
          caseId: schema.legalCases.caseId,
          loanAccountNumber: schema.legalCases.loanAccountNumber,
          borrowerName: schema.legalCases.borrowerName,
          caseType: schema.legalCases.caseType,
          courtName: schema.legalCases.courtName,
          caseFiledDate: schema.legalCases.caseFiledDate,
          lawyerAssignedId: schema.legalCases.lawyerAssignedId,
          filingJurisdiction: schema.legalCases.filingJurisdiction,
          currentStatus: schema.legalCases.currentStatus,
          nextHearingDate: schema.legalCases.nextHearingDate,
          lastHearingOutcome: schema.legalCases.lastHearingOutcome,
          recoveryActionLinked: schema.legalCases.recoveryActionLinked,
          createdBy: schema.legalCases.createdBy,
          caseRemarks: schema.legalCases.caseRemarks,
          caseClosureDate: schema.legalCases.caseClosureDate,
          outcomeSummary: schema.legalCases.outcomeSummary,
          createdAt: schema.legalCases.createdAt,
          updatedAt: schema.legalCases.updatedAt,
          updatedBy: schema.legalCases.updatedBy,
          lawyerName: schema.lawyers.fullName,
        })
        .from(schema.legalCases)
        .leftJoin(schema.lawyers, eq(schema.legalCases.lawyerAssignedId, schema.lawyers.id))
        .where(whereClause)
        .orderBy(desc(schema.legalCases.createdAt))
        .limit(limit)
        .offset(offset);

      const cases = legalCases.map((case_) => this.mapToResponseDtoWithLawyer(case_));

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
      // Check if case exists
      const existingCase = await this.db
        .select()
        .from(schema.legalCases)
        .where(eq(schema.legalCases.id, id))
        .limit(1);

      if (existingCase.length === 0) {
        throw new NotFoundException(`Legal case with ID ${id} not found`);
      }

      // Validate lawyer assignment if provided
      if (updateDto.lawyerAssignedId) {
        const lawyer = await this.db
          .select()
          .from(schema.lawyers)
          .where(eq(schema.lawyers.id, updateDto.lawyerAssignedId))
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

      // Update the legal case
      const updatedCase = await this.db
        .update(schema.legalCases)
        .set({
          ...updateDto,
          updatedAt: new Date(),
          updatedBy,
        })
        .where(eq(schema.legalCases.id, id))
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
        updateData.caseClosureDate = caseClosureDate;
      }

      if (outcomeSummary) {
        updateData.outcomeSummary = outcomeSummary;
      }

      const updatedCase = await this.db
        .update(schema.legalCases)
        .set(updateData)
        .where(eq(schema.legalCases.id, id))
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
      const existingCase = await this.db
        .select()
        .from(schema.legalCases)
        .where(eq(schema.legalCases.id, id))
        .limit(1);

      if (existingCase.length === 0) {
        throw new NotFoundException(`Legal case with ID ${id} not found`);
      }

      // For now, we'll just update the updatedBy field to indicate deletion
      // In a real implementation, you might want to add a deletedAt field or isDeleted flag
      await this.db
        .update(schema.legalCases)
        .set({
          updatedAt: new Date(),
          updatedBy: `${deletedBy}-DELETED`,
        })
        .where(eq(schema.legalCases.id, id));

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
      const legalCases = await this.db
        .select({
          id: schema.legalCases.id,
          caseId: schema.legalCases.caseId,
          loanAccountNumber: schema.legalCases.loanAccountNumber,
          borrowerName: schema.legalCases.borrowerName,
          caseType: schema.legalCases.caseType,
          courtName: schema.legalCases.courtName,
          caseFiledDate: schema.legalCases.caseFiledDate,
          lawyerAssignedId: schema.legalCases.lawyerAssignedId,
          filingJurisdiction: schema.legalCases.filingJurisdiction,
          currentStatus: schema.legalCases.currentStatus,
          nextHearingDate: schema.legalCases.nextHearingDate,
          lastHearingOutcome: schema.legalCases.lastHearingOutcome,
          recoveryActionLinked: schema.legalCases.recoveryActionLinked,
          createdBy: schema.legalCases.createdBy,
          caseRemarks: schema.legalCases.caseRemarks,
          caseClosureDate: schema.legalCases.caseClosureDate,
          outcomeSummary: schema.legalCases.outcomeSummary,
          createdAt: schema.legalCases.createdAt,
          updatedAt: schema.legalCases.updatedAt,
          updatedBy: schema.legalCases.updatedBy,
          lawyerName: schema.lawyers.fullName,
        })
        .from(schema.legalCases)
        .leftJoin(schema.lawyers, eq(schema.legalCases.lawyerAssignedId, schema.lawyers.id))
        .where(eq(schema.legalCases.currentStatus, status as any))
        .orderBy(desc(schema.legalCases.createdAt));

      return legalCases.map((case_) => this.mapToResponseDtoWithLawyer(case_));
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
      const legalCases = await this.db
        .select({
          id: schema.legalCases.id,
          caseId: schema.legalCases.caseId,
          loanAccountNumber: schema.legalCases.loanAccountNumber,
          borrowerName: schema.legalCases.borrowerName,
          caseType: schema.legalCases.caseType,
          courtName: schema.legalCases.courtName,
          caseFiledDate: schema.legalCases.caseFiledDate,
          lawyerAssignedId: schema.legalCases.lawyerAssignedId,
          filingJurisdiction: schema.legalCases.filingJurisdiction,
          currentStatus: schema.legalCases.currentStatus,
          nextHearingDate: schema.legalCases.nextHearingDate,
          lastHearingOutcome: schema.legalCases.lastHearingOutcome,
          recoveryActionLinked: schema.legalCases.recoveryActionLinked,
          createdBy: schema.legalCases.createdBy,
          caseRemarks: schema.legalCases.caseRemarks,
          caseClosureDate: schema.legalCases.caseClosureDate,
          outcomeSummary: schema.legalCases.outcomeSummary,
          createdAt: schema.legalCases.createdAt,
          updatedAt: schema.legalCases.updatedAt,
          updatedBy: schema.legalCases.updatedBy,
          lawyerName: schema.lawyers.fullName,
        })
        .from(schema.legalCases)
        .leftJoin(schema.lawyers, eq(schema.legalCases.lawyerAssignedId, schema.lawyers.id))
        .where(eq(schema.legalCases.lawyerAssignedId, lawyerId))
        .orderBy(desc(schema.legalCases.createdAt));

      return legalCases.map((case_) => this.mapToResponseDtoWithLawyer(case_));
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
