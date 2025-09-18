import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
  MaxLength,
  ValidateIf,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { IsFutureOrToday, IsAfterOrEqualDate } from '../validators/date-validators';

export class DocumentUploadDto {
  @ApiProperty({
    description: 'Name/title of the document',
    example: 'Affidavit of John Doe',
  })
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @ApiProperty({
    description: 'Type of case document',
    enum: [
      'Affidavit',
      'Summons',
      'Court Order',
      'Evidence',
      'Witness Statement',
      'Expert Report',
      'Medical Report',
      'Financial Statement',
      'Property Document',
      'Legal Notice',
      'Reply Notice',
      'Counter Affidavit',
      'Interim Order',
      'Final Order',
      'Judgment',
      'Settlement Agreement',
      'Compromise Deed',
      'Power of Attorney',
      'Authorization Letter',
      'Identity Proof',
      'Address Proof',
      'Income Proof',
      'Bank Statement',
      'Loan Agreement',
      'Security Document',
      'Other',
    ],
    example: 'Affidavit',
  })
  @IsEnum([
    'Affidavit',
    'Summons',
    'Court Order',
    'Evidence',
    'Witness Statement',
    'Expert Report',
    'Medical Report',
    'Financial Statement',
    'Property Document',
    'Legal Notice',
    'Reply Notice',
    'Counter Affidavit',
    'Interim Order',
    'Final Order',
    'Judgment',
    'Settlement Agreement',
    'Compromise Deed',
    'Power of Attorney',
    'Authorization Letter',
    'Identity Proof',
    'Address Proof',
    'Income Proof',
    'Bank Statement',
    'Loan Agreement',
    'Security Document',
    'Other',
  ])
  @IsNotEmpty()
  caseDocumentType: string;

  @ApiProperty({
    description: 'Date of the hearing this document is related to',
    example: '2025-08-15',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.hearingDate !== undefined && o.hearingDate !== null && o.hearingDate !== '')
  @IsDateString()
  @IsFutureOrToday({ message: 'Hearing date must be today or later' })
  hearingDate?: string | null;

  @ApiProperty({
    description: 'Date when the document was created/issued',
    example: '2025-07-21',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  documentDate?: string;

  @ApiProperty({
    description: 'Whether the document is confidential',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  confidentialFlag?: boolean;

  @ApiProperty({
    description: 'Additional remarks about the document',
    example: 'Initial affidavit for case proceedings',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string | null;
}

export class CreateLegalCaseWithDocumentsDto {
  @ApiProperty({
    description: 'Loan account number of the borrower',
    example: 'LN4567890',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  loanAccountNumber: string;

  @ApiProperty({
    description: 'Type of legal case initiated',
    enum: ['Civil', 'Criminal', 'Arbitration', '138 Bounce', 'SARFAESI'],
    example: 'Civil',
  })
  @IsEnum(['Civil', 'Criminal', 'Arbitration', '138 Bounce', 'SARFAESI'])
  @IsNotEmpty()
  caseType: 'Civil' | 'Criminal' | 'Arbitration' | '138 Bounce' | 'SARFAESI';

  @ApiProperty({
    description: 'Court where the case is filed',
    example: 'Mumbai Sessions Court',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  courtName: string;

  @ApiProperty({
    description: 'Date of formal case filing',
    example: '2025-07-21',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  caseFiledDate: string;

  @ApiProperty({
    description: 'ID of the lawyer assigned to the case',
    example: 'uuid-lawyer-id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  lawyerAssignedId?: string;

  @ApiProperty({
    description: 'Court location/state/district',
    example: 'Mumbai, Maharashtra',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  filingJurisdiction: string;

  @ApiProperty({
    description: 'Present legal state of the case',
    enum: ['Filed', 'Under Trial', 'Stayed', 'Dismissed', 'Resolved', 'Closed'],
    example: 'Filed',
    required: false,
  })
  @IsOptional()
  @IsEnum(['Filed', 'Under Trial', 'Stayed', 'Dismissed', 'Resolved', 'Closed'])
  currentStatus?: 'Filed' | 'Under Trial' | 'Stayed' | 'Dismissed' | 'Resolved' | 'Closed';

  @ApiProperty({
    description: 'Scheduled date for next hearing',
    example: '2025-08-15',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.nextHearingDate !== undefined && o.nextHearingDate !== null && o.nextHearingDate !== '',
  )
  @IsDateString()
  @IsFutureOrToday({ message: 'Next hearing date must be today or later' })
  nextHearingDate?: string | null;

  @ApiProperty({
    description: 'Remarks or decisions from last hearing',
    example: 'Case adjourned to next hearing date',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lastHearingOutcome?: string | null;

  @ApiProperty({
    description: 'If case resulted in any recovery action',
    enum: ['Repossession', 'Settlement', 'Warrant Issued', 'None'],
    example: 'None',
    required: false,
  })
  @IsOptional()
  @IsEnum(['Repossession', 'Settlement', 'Warrant Issued', 'None'])
  recoveryActionLinked?: 'Repossession' | 'Settlement' | 'Warrant Issued' | 'None' | null;

  @ApiProperty({
    description: 'Internal notes for tracking',
    example: 'Initial case filing for loan default',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caseRemarks?: string | null;

  @ApiProperty({
    description: 'Date on which case was officially closed',
    example: '2025-12-31',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.caseClosureDate !== undefined && o.caseClosureDate !== null && o.caseClosureDate !== '',
  )
  @IsDateString()
  @ValidateIf((o) => o.currentStatus === 'Closed' || o.currentStatus === 'Resolved')
  @IsAfterOrEqualDate('caseFiledDate', {
    message: 'Case closure date must be greater than or equal to case filed date',
  })
  caseClosureDate?: string | null;

  @ApiProperty({
    description: 'Final decision or resolution notes',
    example: 'Case resolved through settlement agreement',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  outcomeSummary?: string | null;

  @ApiProperty({
    description: 'Documents to upload with the case',
    type: [DocumentUploadDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentUploadDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        return [];
      }
    }
    return value;
  })
  documents?: DocumentUploadDto[];
}
