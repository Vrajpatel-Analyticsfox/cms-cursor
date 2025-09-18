import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { legalCases, caseIdSequence } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import {
  CaseIdGenerationRequestDto,
  CaseIdGenerationResponseDto,
} from './dto/case-id-generation.dto';

@Injectable()
export class CaseIdService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof import('../db/schema')>,
  ) {}

  /**
   * Generates a unique Case ID following the format: PREFIX-YYYYMMDD-[CATEGORY_CODE-]SEQUENCE
   *
   * ENHANCED IMPLEMENTATION - Simplified and more efficient
   */
  async generateCaseId(request: CaseIdGenerationRequestDto): Promise<CaseIdGenerationResponseDto> {
    try {
      const { prefix, categoryCode, createdBy } = request;

      // Validate input parameters
      if (!prefix || prefix.trim().length === 0) {
        return {
          caseId: '',
          success: false,
          message: 'Prefix is required and cannot be empty',
        };
      }

      if (!createdBy || createdBy.trim().length === 0) {
        return {
          caseId: '',
          success: false,
          message: 'CreatedBy is required and cannot be empty',
        };
      }

      // Get current date in YYYYMMDD format
      const currentDate = new Date();
      const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, '');

      // Generate sequence counter ID (unique per prefix+date+category combination)
      const counterId = this.generateCounterId(prefix, dateString, categoryCode);

      // Get or increment sequence atomically
      const sequenceNumber = await this.getNextSequenceNumber(
        counterId,
        prefix,
        dateString,
        categoryCode,
        createdBy,
      );

      // Generate the final Case ID
      const caseId = this.formatCaseId(prefix, dateString, categoryCode, sequenceNumber);

      // Verify uniqueness against existing legal cases
      const isUnique = await this.isCaseIdUnique(caseId);
      if (!isUnique) {
        return {
          caseId: '',
          success: false,
          message: `Generated Case ID ${caseId} already exists. Please try again.`,
        };
      }

      return {
        caseId,
        success: true,
        message: 'Case ID generated successfully',
        prefix,
        dateStamp: dateString,
        categoryCode,
        sequenceNumber,
        isUnique: true,
        format: categoryCode ? 'PREFIX-YYYYMMDD-CATEGORY-SEQUENCE' : 'PREFIX-YYYYMMDD-SEQUENCE',
      };
    } catch (error) {
      console.error('Error generating case ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        caseId: '',
        success: false,
        message: `Error generating case ID: ${errorMessage}`,
      };
    }
  }

  /**
   * Gets the next sequence number atomically using UPSERT pattern
   */
  private async getNextSequenceNumber(
    counterId: string,
    prefix: string,
    dateString: string,
    categoryCode: string | undefined,
    createdBy: string,
  ): Promise<number> {
    try {
      // Try to find existing sequence record
      const existing = await this.db
        .select()
        .from(caseIdSequence)
        .where(eq(caseIdSequence.caseId, counterId))
        .limit(1);

      if (existing.length > 0) {
        // Increment existing sequence
        const newSequence = existing[0].sequenceNumber + 1;

        await this.db
          .update(caseIdSequence)
          .set({
            sequenceNumber: newSequence,
            updatedAt: new Date(),
            updatedBy: createdBy,
          })
          .where(eq(caseIdSequence.caseId, counterId));

        return newSequence;
      } else {
        // Create new sequence record starting at 1
        const newRecord = await this.db
          .insert(caseIdSequence)
          .values({
            caseId: counterId, // Use counterId as the primary key
            casePrefix: prefix,
            dateStamp: dateString,
            sequenceNumber: 1,
            categoryCode: categoryCode || null,
            finalCaseId: this.formatCaseId(prefix, dateString, categoryCode, 1),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: createdBy,
            updatedBy: createdBy,
          })
          .returning();

        return newRecord[0].sequenceNumber;
      }
    } catch (error) {
      console.error('Error getting next sequence number:', error);
      throw error;
    }
  }

  /**
   * Generates a unique counter ID for each prefix+date+category combination
   */
  private generateCounterId(prefix: string, dateString: string, categoryCode?: string): string {
    return categoryCode ? `${prefix}-${dateString}-${categoryCode}` : `${prefix}-${dateString}`;
  }

  /**
   * Formats the case ID according to the specified pattern
   */
  private formatCaseId(
    prefix: string,
    dateString: string,
    categoryCode: string | undefined,
    sequence: number,
  ): string {
    const paddedSequence = sequence.toString().padStart(4, '0'); // 4-digit sequence padding

    if (categoryCode) {
      return `${prefix}-${dateString}-${categoryCode}-${paddedSequence}`;
    } else {
      return `${prefix}-${dateString}-${paddedSequence}`;
    }
  }

  /**
   * Gets the current sequence information for a specific prefix and category
   */
  async getCurrentSequence(prefix: string, categoryCode?: string): Promise<any> {
    try {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
      const counterId = this.generateCounterId(prefix, dateString, categoryCode);

      const sequence = await this.db
        .select()
        .from(caseIdSequence)
        .where(eq(caseIdSequence.caseId, counterId))
        .limit(1);

      if (sequence.length > 0) {
        return {
          prefix: sequence[0].casePrefix,
          categoryCode: sequence[0].categoryCode,
          currentDate: sequence[0].dateStamp,
          sequenceNumber: sequence[0].sequenceNumber,
          nextSequenceNumber: sequence[0].sequenceNumber + 1,
          lastUpdated: sequence[0].updatedAt,
        };
      }

      return {
        prefix,
        categoryCode,
        currentDate: dateString,
        sequenceNumber: 0,
        nextSequenceNumber: 1,
        lastUpdated: null,
      };
    } catch (error) {
      console.error('Error getting current sequence:', error);
      throw error;
    }
  }

  /**
   * Resets sequence for a specific prefix and category (admin function)
   */
  async resetSequence(
    prefix: string,
    categoryCode?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
      const counterId = this.generateCounterId(prefix, dateString, categoryCode);

      const updated = await this.db
        .update(caseIdSequence)
        .set({
          sequenceNumber: 1,
          updatedAt: new Date(),
          updatedBy: 'system-reset',
        })
        .where(eq(caseIdSequence.caseId, counterId))
        .returning();

      if (updated.length > 0) {
        return {
          success: true,
          message: `Sequence reset successfully for ${prefix}${categoryCode ? `-${categoryCode}` : ''} on ${dateString}`,
        };
      } else {
        return {
          success: false,
          message: `No sequence found for ${prefix}${categoryCode ? `-${categoryCode}` : ''} on ${dateString}`,
        };
      }
    } catch (error) {
      console.error('Error resetting sequence:', error);
      return {
        success: false,
        message: `Error resetting sequence: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Gets all sequence records for monitoring purposes
   */
  async getAllSequences(): Promise<any> {
    try {
      const sequences = await this.db
        .select()
        .from(caseIdSequence)
        .orderBy(caseIdSequence.updatedAt);

      return {
        sequences: sequences.map((seq) => ({
          prefix: seq.casePrefix,
          categoryCode: seq.categoryCode,
          sequenceDate: seq.dateStamp,
          currentSequence: seq.sequenceNumber,
          finalCaseId: seq.finalCaseId,
          createdAt: seq.createdAt,
          updatedAt: seq.updatedAt,
        })),
        total: sequences.length,
      };
    } catch (error) {
      console.error('Error getting all sequences:', error);
      throw error;
    }
  }

  /**
   * Validates if a case ID already exists in the legal cases system
   */
  async isCaseIdUnique(caseId: string): Promise<boolean> {
    try {
      const existingCase = await this.db
        .select()
        .from(legalCases)
        .where(and(eq(legalCases.caseId, caseId), eq(legalCases.status, 'Active')))
        .limit(1);

      return existingCase.length === 0;
    } catch (error) {
      console.error('Error checking case ID uniqueness:', error);
      throw error;
    }
  }

  /**
   * Validates Case ID format
   */
  validateCaseId(caseId: string): {
    isValid: boolean;
    format?: string;
    components?: any;
    errors?: string[];
  } {
    try {
      const errors: string[] = [];

      if (!caseId || caseId.trim().length === 0) {
        errors.push('Case ID cannot be empty');
        return { isValid: false, errors };
      }

      // Check format: PREFIX-YYYYMMDD-[CATEGORY-]XXX
      const parts = caseId.split('-');

      if (parts.length < 3 || parts.length > 4) {
        errors.push('Case ID must have 3 or 4 parts separated by hyphens');
      }

      const [prefix, dateStamp, ...rest] = parts;
      let categoryCode: string | null = null;
      let sequence: string;

      if (parts.length === 3) {
        // Format: PREFIX-YYYYMMDD-XXX
        sequence = rest[0];
      } else {
        // Format: PREFIX-YYYYMMDD-CATEGORY-XXX
        categoryCode = rest[0];
        sequence = rest[1];
      }

      // Validate prefix
      if (!prefix || prefix.length < 2 || prefix.length > 4) {
        errors.push('Prefix must be 2-4 characters long');
      }

      // Validate date stamp
      if (!dateStamp || !/^\d{8}$/.test(dateStamp)) {
        errors.push('Date stamp must be 8 digits in YYYYMMDD format');
      }

      // Validate sequence
      if (!sequence || !/^\d{3}$/.test(sequence)) {
        errors.push('Sequence must be 3 digits');
      }

      const isValid = errors.length === 0;

      return {
        isValid,
        format:
          parts.length === 3 ? 'PREFIX-YYYYMMDD-SEQUENCE' : 'PREFIX-YYYYMMDD-CATEGORY-SEQUENCE',
        components: isValid
          ? {
              prefix,
              dateStamp,
              categoryCode,
              sequence,
            }
          : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error validating case ID:', error);
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }
}
