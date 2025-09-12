import { Controller, Get, Inject } from '@nestjs/common';
import { eq, or, and } from 'drizzle-orm';
import * as schema from '../../db/schema';

@Controller('debug')
export class DebugController {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  @Get('populate-database')
  async populateDatabase() {
    try {
      console.log('Starting database population...');

      // Check if data already exists
      const existingFields = await this.db
        .select({ count: schema.fvfSchema.id })
        .from(schema.fvfSchema);

      console.log('Existing field validation records:', existingFields.length);

      if (existingFields.length > 0) {
        return { message: 'Database already populated, skipping...' };
      }

      // Insert field validation format records using Drizzle
      console.log('Inserting field validation format records...');

      const fieldValidationRecords = [
        {
          category: 'Borrower Info',
          field_name: 'Loan Account Number',
          regex: '^[0-9]+$',
          message: 'Must be numeric',
          description: 'Unique loan account identifier',
          digital: 'true',
          physical: 'true',
        },
        {
          category: 'Borrower Info',
          field_name: 'Full Name',
          regex: '^[a-zA-Z\\s]+$',
          message: 'Must contain only letters and spaces',
          description: 'Borrower full name',
          digital: 'true',
          physical: 'true',
        },
        {
          category: 'Borrower Info',
          field_name: 'Mobile Number',
          regex: '^[0-9]{10}$',
          message: 'Must be 10 digits',
          description: 'Borrower mobile number',
          digital: 'true',
          physical: 'true',
        },
        {
          category: 'Borrower Info',
          field_name: 'Email Address',
          regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          message: 'Must be valid email format',
          description: 'Borrower email address',
          digital: 'true',
          physical: 'true',
        },
        {
          category: 'Borrower Info',
          field_name: 'Address',
          regex: '^.+$',
          message: 'Cannot be empty',
          description: 'Borrower address',
          digital: 'true',
          physical: 'true',
        },
        {
          category: 'Loan Info',
          field_name: 'Loan Amount',
          regex: '^[0-9]+(\\.[0-9]{2})?$',
          message: 'Must be numeric with up to 2 decimal places',
          description: 'Original loan amount',
          digital: 'true',
          physical: 'true',
        },
        {
          category: 'Loan Info',
          field_name: 'Outstanding Amount',
          regex: '^[0-9]+(\\.[0-9]{2})?$',
          message: 'Must be numeric with up to 2 decimal places',
          description: 'Current outstanding amount',
          digital: 'true',
          physical: 'true',
        },
        {
          category: 'Loan Info',
          field_name: 'DPD Days',
          regex: '^[0-9]+$',
          message: 'Must be numeric',
          description: 'Days past due',
          digital: 'true',
          physical: 'true',
        },
        {
          category: 'Loan Info',
          field_name: 'Product Type',
          regex: '^.+$',
          message: 'Cannot be empty',
          description: 'Type of loan product',
          digital: 'true',
          physical: 'true',
        },
        {
          category: 'Loan Info',
          field_name: 'Branch Code',
          regex: '^[A-Z0-9]+$',
          message: 'Must be alphanumeric',
          description: 'Branch code',
          digital: 'true',
          physical: 'true',
        },
      ];

      for (const record of fieldValidationRecords) {
        await this.db.insert(schema.fvfSchema).values(record);
      }

      console.log('Field validation format records inserted');

      // Get field IDs
      const fieldIds = await this.db
        .select({
          loan_account_id: schema.fvfSchema.id,
          full_name_id: schema.fvfSchema.id,
          mobile_id: schema.fvfSchema.id,
          email_id: schema.fvfSchema.id,
          address_id: schema.fvfSchema.id,
          loan_amount_id: schema.fvfSchema.id,
          outstanding_amount_id: schema.fvfSchema.id,
          dpd_id: schema.fvfSchema.id,
          product_type_id: schema.fvfSchema.id,
          branch_code_id: schema.fvfSchema.id,
        })
        .from(schema.fvfSchema)
        .where(
          or(
            eq(schema.fvfSchema.field_name, 'Loan Account Number'),
            eq(schema.fvfSchema.field_name, 'Full Name'),
            eq(schema.fvfSchema.field_name, 'Mobile Number'),
            eq(schema.fvfSchema.field_name, 'Email Address'),
            eq(schema.fvfSchema.field_name, 'Address'),
            eq(schema.fvfSchema.field_name, 'Loan Amount'),
            eq(schema.fvfSchema.field_name, 'Outstanding Amount'),
            eq(schema.fvfSchema.field_name, 'DPD Days'),
            eq(schema.fvfSchema.field_name, 'Product Type'),
            eq(schema.fvfSchema.field_name, 'Branch Code'),
          ),
        );

      console.log('Field IDs retrieved:', fieldIds.length);

      // Create a map of field names to IDs
      const fieldMap = new Map();
      for (const field of fieldIds) {
        if (field.loan_account_id) fieldMap.set('Loan Account Number', field.loan_account_id);
        if (field.full_name_id) fieldMap.set('Full Name', field.full_name_id);
        if (field.mobile_id) fieldMap.set('Mobile Number', field.mobile_id);
        if (field.email_id) fieldMap.set('Email Address', field.email_id);
        if (field.address_id) fieldMap.set('Address', field.address_id);
        if (field.loan_amount_id) fieldMap.set('Loan Amount', field.loan_amount_id);
        if (field.outstanding_amount_id)
          fieldMap.set('Outstanding Amount', field.outstanding_amount_id);
        if (field.dpd_id) fieldMap.set('DPD Days', field.dpd_id);
        if (field.product_type_id) fieldMap.set('Product Type', field.product_type_id);
        if (field.branch_code_id) fieldMap.set('Branch Code', field.branch_code_id);
      }

      console.log('Field map created:', fieldMap.size);

      // Generate raw data ID and record ID
      const rawDataId = '550e8400-e29b-41d4-a716-446655440000';
      const recordId = 'e901eb2c-e8fb-4ada-9aa0-b070882fdf8c';

      console.log('Inserting sample data for loan account 52222222142...');

      // Insert sample data
      const sampleData = [
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('Loan Account Number'),
          record_id: recordId,
          value: '52222222142',
        },
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('Full Name'),
          record_id: recordId,
          value: 'John Doe',
        },
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('Mobile Number'),
          record_id: recordId,
          value: '9876543210',
        },
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('Email Address'),
          record_id: recordId,
          value: 'john.doe@example.com',
        },
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('Address'),
          record_id: recordId,
          value: '123 Main Street, City, State 12345',
        },
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('Loan Amount'),
          record_id: recordId,
          value: '100000.00',
        },
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('Outstanding Amount'),
          record_id: recordId,
          value: '75000.00',
        },
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('DPD Days'),
          record_id: recordId,
          value: '45',
        },
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('Product Type'),
          record_id: recordId,
          value: 'Personal Loan',
        },
        {
          rawData_id: rawDataId,
          field_validation_id: fieldMap.get('Branch Code'),
          record_id: recordId,
          value: 'BR001',
        },
      ];

      for (const data of sampleData) {
        await this.db.insert(schema.divSchema).values(data);
      }

      console.log('Sample data inserted successfully!');
      return { message: 'Database populated successfully with loan account: 52222222142' };
    } catch (error) {
      console.error('Error populating database:', error);
      return { error: error.message, stack: error.stack };
    }
  }

  @Get('database-status')
  async getDatabaseStatus() {
    try {
      // Check field_validation_format table
      const fieldCount = await this.db
        .select({ count: schema.fvfSchema.id })
        .from(schema.fvfSchema);

      const fieldNames = await this.db
        .select({ fieldName: schema.fvfSchema.field_name })
        .from(schema.fvfSchema);

      // Check data_ingestion_validated table
      const validatedCount = await this.db
        .select({ count: schema.divSchema.id })
        .from(schema.divSchema);

      // Check data_ingestion_failed table
      const failedCount = await this.db
        .select({ count: schema.difSchema.id })
        .from(schema.difSchema);

      // Check legal_notice_templates table
      let lntCount = 0;
      let lntError = null;
      try {
        const lntResult = await this.db
          .select({ count: schema.legalNoticeTemplates.id })
          .from(schema.legalNoticeTemplates);
        lntCount = lntResult.length;
      } catch (error) {
        lntError = error.message;
      }

      // Test the specific query that's failing
      const testQuery = await this.db
        .select({
          fieldName: schema.fvfSchema.field_name,
          value: schema.divSchema.value,
          recordId: schema.divSchema.record_id,
        })
        .from(schema.divSchema)
        .innerJoin(schema.fvfSchema, eq(schema.divSchema.field_validation_id, schema.fvfSchema.id))
        .where(
          and(
            eq(schema.divSchema.value, '52222222142'),
            eq(schema.fvfSchema.field_name, 'Loan Account Number'),
          ),
        );

      return {
        fieldValidationFormat: {
          count: fieldCount.length,
          fieldNames: fieldNames.map((f) => f.fieldName),
        },
        dataIngestionValidated: {
          count: validatedCount.length,
        },
        dataIngestionFailed: {
          count: failedCount.length,
        },
        legalNoticeTemplates: {
          count: lntCount,
          error: lntError,
        },
        testQuery: {
          result: testQuery,
          count: testQuery.length,
        },
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack,
      };
    }
  }
}
