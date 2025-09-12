import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { eq, and, or, like, desc, asc, count, sql } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { BorrowerSearchDto, BorrowerListResponseDto, BorrowerDto } from '../dto/borrower.dto';

@Injectable()
export class BorrowerService {
  private readonly logger = new Logger(BorrowerService.name);

  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  /**
   * Get list of borrowers with basic search functionality
   */
  async getBorrowers(searchDto: BorrowerSearchDto): Promise<BorrowerListResponseDto> {
    try {
      const {
        search,
        page = 1,
        limit = 10,
        sortBy = 'borrowerName',
        sortOrder = 'asc',
      } = searchDto;

      const offset = (page - 1) * limit;

      // Build search conditions
      const conditions: any[] = [];

      if (search) {
        // Search in both borrower name and loan account number
        conditions.push(
          or(
            eq(schema.fvfSchema.field_name, 'Full Name'),
            eq(schema.fvfSchema.field_name, 'Loan Account Number'),
          ),
        );
      }

      // Get all unique record IDs that match the search criteria
      let recordIds: string[] = [];

      if (search) {
        // First try to search in validated data
        let searchResults = await this.db
          .select({
            recordId: schema.divSchema.record_id,
            fieldName: schema.fvfSchema.field_name,
            value: schema.divSchema.value,
          })
          .from(schema.divSchema)
          .innerJoin(
            schema.fvfSchema,
            eq(schema.divSchema.field_validation_id, schema.fvfSchema.id),
          )
          .where(
            and(
              or(
                like(schema.divSchema.value, `%${search}%`),
                like(schema.divSchema.value, `%${search.toUpperCase()}%`),
                like(schema.divSchema.value, `%${search.toLowerCase()}%`),
              ),
              or(
                eq(schema.fvfSchema.field_name, 'Full Name'),
                eq(schema.fvfSchema.field_name, 'Loan Account Number'),
              ),
            ),
          );

        // Note: data_ingestion_failed doesn't have record_id, so we can't group by record
        // For now, we'll only work with validated data

        // Group by record ID and filter records that have both name and account number
        const recordMap = new Map<string, { name?: string; account?: string }>();

        for (const result of searchResults) {
          if (result.recordId && !recordMap.has(result.recordId)) {
            recordMap.set(result.recordId, {});
          }

          if (result.recordId) {
            const record = recordMap.get(result.recordId)!;
            if (result.fieldName === 'Full Name' && result.value) {
              record.name = result.value;
            } else if (result.fieldName === 'Loan Account Number' && result.value) {
              record.account = result.value;
            }
          }
        }

        // Only include records that have both name and account number
        recordIds = Array.from(recordMap.entries())
          .filter(([_, data]) => data.name && data.account)
          .map(([recordId, _]) => recordId);
      } else {
        // If no search term, get all record IDs that have both name and account number
        // First try validated data
        let allRecords = await this.db
          .select({
            recordId: schema.divSchema.record_id,
            fieldName: schema.fvfSchema.field_name,
          })
          .from(schema.divSchema)
          .innerJoin(
            schema.fvfSchema,
            eq(schema.divSchema.field_validation_id, schema.fvfSchema.id),
          )
          .where(
            or(
              eq(schema.fvfSchema.field_name, 'Full Name'),
              eq(schema.fvfSchema.field_name, 'Loan Account Number'),
            ),
          );

        // Note: data_ingestion_failed doesn't have record_id, so we can't group by record
        // For now, we'll only work with validated data

        const recordMap = new Map<string, Set<string>>();
        for (const result of allRecords) {
          if (result.recordId && !recordMap.has(result.recordId)) {
            recordMap.set(result.recordId, new Set());
          }
          if (result.recordId && result.fieldName) {
            recordMap.get(result.recordId)!.add(result.fieldName);
          }
        }

        recordIds = Array.from(recordMap.entries())
          .filter(([_, fields]) => fields.has('Full Name') && fields.has('Loan Account Number'))
          .map(([recordId, _]) => recordId);
      }

      if (recordIds.length === 0) {
        return {
          borrowers: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Get borrower data for the filtered record IDs
      const borrowerData = await this.getBorrowerDataForRecords(recordIds);

      // Apply sorting
      borrowerData.sort((a, b) => {
        let aValue: string;
        let bValue: string;

        switch (sortBy) {
          case 'borrowerName':
            aValue = a.borrowerName || '';
            bValue = b.borrowerName || '';
            break;
          case 'loanAccountNumber':
            aValue = a.loanAccountNumber || '';
            bValue = b.loanAccountNumber || '';
            break;
          case 'createdAt':
            aValue = a.createdAt || '';
            bValue = b.createdAt || '';
            break;
          default:
            aValue = a.borrowerName || '';
            bValue = b.borrowerName || '';
        }

        if (sortOrder === 'desc') {
          return bValue.localeCompare(aValue);
        }
        return aValue.localeCompare(bValue);
      });

      // Apply pagination
      const total = borrowerData.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedData = borrowerData.slice(offset, offset + limit);

      return {
        borrowers: paginatedData,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      this.logger.error('Error getting borrowers:', error);
      throw new BadRequestException('Failed to retrieve borrower list');
    }
  }

  /**
   * Advanced search for borrowers with multiple filters
   */
  async searchBorrowers(searchDto: BorrowerSearchDto): Promise<BorrowerListResponseDto> {
    try {
      const {
        borrowerName,
        loanAccountNumber,
        mobileNumber,
        email,
        productType,
        branchCode,
        page = 1,
        limit = 10,
        sortBy = 'borrowerName',
        sortOrder = 'asc',
      } = searchDto;

      const offset = (page - 1) * limit;

      // Build search conditions for each field
      const searchConditions: { fieldName: string; value: string }[] = [];

      if (borrowerName) {
        searchConditions.push({
          fieldName: 'Full Name',
          value: borrowerName,
        });
      }

      if (loanAccountNumber) {
        searchConditions.push({
          fieldName: 'Loan Account Number',
          value: loanAccountNumber,
        });
      }

      if (mobileNumber) {
        searchConditions.push({
          fieldName: 'Mobile Number',
          value: mobileNumber,
        });
      }

      if (email) {
        searchConditions.push({
          fieldName: 'Email Address',
          value: email,
        });
      }

      if (productType) {
        searchConditions.push({
          fieldName: 'Product Type',
          value: productType,
        });
      }

      if (branchCode) {
        searchConditions.push({
          fieldName: 'Branch Code',
          value: branchCode,
        });
      }

      if (searchConditions.length === 0) {
        // If no specific filters, return all borrowers
        return this.getBorrowers({ page, limit, sortBy, sortOrder });
      }

      // Get record IDs that match all the search conditions
      let matchingRecordIds: string[] = [];

      for (const condition of searchConditions) {
        const results = await this.db
          .select({
            recordId: schema.divSchema.record_id,
          })
          .from(schema.divSchema)
          .innerJoin(
            schema.fvfSchema,
            eq(schema.divSchema.field_validation_id, schema.fvfSchema.id),
          )
          .where(
            and(
              eq(schema.fvfSchema.field_name, condition.fieldName),
              like(schema.divSchema.value, `%${condition.value}%`),
            ),
          );

        const recordIds = results.map((r) => r.recordId).filter((id): id is string => id !== null);

        if (matchingRecordIds.length === 0) {
          matchingRecordIds = recordIds;
        } else {
          // Intersection of record IDs (records that match all conditions)
          matchingRecordIds = matchingRecordIds.filter((id) => recordIds.includes(id));
        }

        if (matchingRecordIds.length === 0) {
          break; // No records match all conditions
        }
      }

      if (matchingRecordIds.length === 0) {
        return {
          borrowers: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Get borrower data for the matching record IDs
      const borrowerData = await this.getBorrowerDataForRecords(matchingRecordIds);

      // Apply sorting
      borrowerData.sort((a, b) => {
        let aValue: string;
        let bValue: string;

        switch (sortBy) {
          case 'borrowerName':
            aValue = a.borrowerName || '';
            bValue = b.borrowerName || '';
            break;
          case 'loanAccountNumber':
            aValue = a.loanAccountNumber || '';
            bValue = b.loanAccountNumber || '';
            break;
          case 'createdAt':
            aValue = a.createdAt || '';
            bValue = b.createdAt || '';
            break;
          default:
            aValue = a.borrowerName || '';
            bValue = b.borrowerName || '';
        }

        if (sortOrder === 'desc') {
          return bValue.localeCompare(aValue);
        }
        return aValue.localeCompare(bValue);
      });

      // Apply pagination
      const total = borrowerData.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedData = borrowerData.slice(offset, offset + limit);

      return {
        borrowers: paginatedData,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      this.logger.error('Error searching borrowers:', error);
      throw new BadRequestException('Failed to search borrowers');
    }
  }

  /**
   * Get borrower data for specific record IDs
   */
  private async getBorrowerDataForRecords(recordIds: string[]): Promise<BorrowerDto[]> {
    if (recordIds.length === 0) {
      return [];
    }

    // Get all data for the specified record IDs from validated data first
    let allData = await this.db
      .select({
        recordId: schema.divSchema.record_id,
        fieldName: schema.fvfSchema.field_name,
        value: schema.divSchema.value,
        createdAt: schema.divSchema.createdAt,
      })
      .from(schema.divSchema)
      .innerJoin(schema.fvfSchema, eq(schema.divSchema.field_validation_id, schema.fvfSchema.id))
      .where(or(...recordIds.map((id) => eq(schema.divSchema.record_id, id))));

    // Note: data_ingestion_failed doesn't have record_id, so we can't group by record
    // For now, we'll only work with validated data

    // Group data by record ID
    const recordMap = new Map<string, Map<string, string>>();
    const createdAtMap = new Map<string, string>();

    for (const data of allData) {
      if (data.recordId && !recordMap.has(data.recordId)) {
        recordMap.set(data.recordId, new Map());
      }
      if (data.recordId && data.fieldName && data.value) {
        recordMap.get(data.recordId)!.set(data.fieldName, data.value);
      }

      if (data.recordId && data.createdAt) {
        createdAtMap.set(data.recordId, data.createdAt.toISOString());
      }
    }

    // Transform to borrower DTOs
    const borrowers: BorrowerDto[] = [];

    for (const [recordId, fields] of recordMap) {
      const borrower: BorrowerDto = {
        loanAccountNumber: fields.get('Loan Account Number') || '',
        borrowerName: fields.get('Full Name') || '',
        borrowerMobile: fields.get('Mobile Number') || undefined,
        borrowerEmail: fields.get('Email') || undefined,
        borrowerAddress: fields.get('Address') || undefined,
        loanAmount: fields.get('Loan Amount') || undefined,
        outstandingAmount: fields.get('Amount') || undefined,
        currentDpd: fields.get('Current DPD')
          ? parseInt(fields.get('Current DPD')!, 10)
          : undefined,
        productType: fields.get('Product Type') || undefined,
        branchCode: fields.get('Branch Code') || undefined,
        createdAt: createdAtMap.get(recordId) || new Date().toISOString(),
      };

      // Only include borrowers that have at least name and account number
      if (borrower.borrowerName && borrower.loanAccountNumber) {
        borrowers.push(borrower);
      }
    }

    return borrowers;
  }
}
