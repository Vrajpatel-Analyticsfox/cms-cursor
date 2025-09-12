import { Injectable, BadRequestException } from '@nestjs/common';
import { db } from '../../db/drizzle.config';
import { eq, and, sql } from 'drizzle-orm';
import { fvfSchema, divSchema } from '../../db/schema';

export interface BorrowerData {
  loanAccountNumber: string;
  borrowerName: string;
  borrowerMobile: string;
  borrowerEmail: string;
  borrowerAddress: string;
  loanAmount: string;
  outstandingAmount: string;
  currentDpd: number;
  productType: string;
  branchCode: string;
}

@Injectable()
export class DataIngestionHelperService {
  constructor() {}

  /**
   * Get borrower data from data_ingestion_validated table
   * @param loanAccountNumber - The loan account number to look up
   * @returns Borrower data or throws error if not found
   */
  async getBorrowerData(loanAccountNumber: string): Promise<BorrowerData> {
    try {
      // Find the record in validated data
      const validatedData = await db
        .select({
          fieldName: fvfSchema.field_name,
          value: divSchema.value,
          recordId: divSchema.record_id,
        })
        .from(divSchema)
        .innerJoin(fvfSchema, eq(fvfSchema.id, divSchema.field_validation_id))
        .where(
          and(
            eq(divSchema.value, loanAccountNumber),
            eq(fvfSchema.field_name, 'Loan Account Number'),
          ),
        );

      if (validatedData.length === 0) {
        throw new BadRequestException(
          `Loan account ${loanAccountNumber} not found in validated data`,
        );
      }

      const recordId = validatedData[0].recordId;
      if (!recordId) {
        throw new BadRequestException(`Invalid record ID for loan account ${loanAccountNumber}`);
      }

      // Get all data for this record
      const allRecordData = await db
        .select({
          fieldName: fvfSchema.field_name,
          value: divSchema.value,
        })
        .from(divSchema)
        .innerJoin(fvfSchema, eq(divSchema.field_validation_id, fvfSchema.id))
        .where(eq(divSchema.record_id, recordId));

      // Transform the data into a structured format
      const borrowerData: BorrowerData = {
        loanAccountNumber,
        borrowerName: '',
        borrowerMobile: '',
        borrowerEmail: '',
        borrowerAddress: '',
        loanAmount: '',
        outstandingAmount: '',
        currentDpd: 0,
        productType: '',
        branchCode: '',
      };

      // Map the field names to borrower data properties
      for (const data of allRecordData) {
        switch (data.fieldName) {
          case 'Full Name':
            borrowerData.borrowerName = data.value || '';
            break;
          case 'Mobile Number':
            borrowerData.borrowerMobile = data.value || '';
            break;
          case 'Email Address':
            borrowerData.borrowerEmail = data.value || '';
            break;
          case 'Address':
            borrowerData.borrowerAddress = data.value || '';
            break;
          case 'Loan Amount':
            borrowerData.loanAmount = data.value || '';
            break;
          case 'Outstanding Amount':
            borrowerData.outstandingAmount = data.value || '';
            break;
          case 'DPD Days':
            borrowerData.currentDpd = parseInt(data.value || '0', 10);
            break;
          case 'Product Type':
            borrowerData.productType = data.value || '';
            break;
          case 'Branch Code':
            borrowerData.branchCode = data.value || '';
            break;
        }
      }

      // Validate that we have at least the borrower name
      if (!borrowerData.borrowerName) {
        throw new BadRequestException(
          `Borrower name not found for loan account ${loanAccountNumber}`,
        );
      }

      return borrowerData;
    } catch (error) {
      throw new BadRequestException(
        `Error retrieving borrower data for account ${loanAccountNumber}: ${error.message}`,
      );
    }
  }

  /**
   * Check if a loan account exists in the validated data
   * @param loanAccountNumber - The loan account number to check
   * @returns boolean indicating if the account exists
   */
  async loanAccountExists(loanAccountNumber: string): Promise<boolean> {
    try {
      const result = await db
        .select({ count: divSchema.id })
        .from(divSchema)
        .innerJoin(fvfSchema, eq(divSchema.field_validation_id, fvfSchema.id))
        .where(
          and(
            eq(sql`(${divSchema.value}::text)`, loanAccountNumber),
            eq(fvfSchema.field_name, 'Loan Account Number'),
          ),
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all loan account numbers from validated data
   * @returns Array of loan account numbers
   */
  async getAllLoanAccountNumbers(): Promise<string[]> {
    try {
      const result = await db
        .select({ value: divSchema.value })
        .from(divSchema)
        .innerJoin(fvfSchema, eq(divSchema.field_validation_id, fvfSchema.id))
        .where(eq(fvfSchema.field_name, 'Loan Account Number'));

      return result.map((row) => row.value).filter((value): value is string => value !== null);
    } catch (error) {
      return [];
    }
  }
}
