import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  MaxLength,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { IsFutureOrToday } from '../../validators/date-validators';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Type of entity this document is linked to (BRD-specified)',
    enum: ['Borrower', 'Loan Account', 'Case ID'],
    example: 'Case ID',
  })
  @IsEnum(['Borrower', 'Loan Account', 'Case ID'])
  @IsNotEmpty()
  linkedEntityType: 'Borrower' | 'Loan Account' | 'Case ID';

  @ApiProperty({
    description: 'ID of the entity this document is linked to',
    example: 'uuid-entity-id',
  })
  @IsUUID()
  @IsNotEmpty()
  linkedEntityId: string;

  @ApiProperty({
    description: 'Name/title of the document',
    example: 'Affidavit of Service',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  documentName: string;

  @ApiProperty({
    description: 'ID of the document type',
    example: 'uuid-document-type-id',
  })
  @IsUUID()
  @IsNotEmpty()
  documentTypeId: string;

  @ApiProperty({
    description: 'Access permissions for the document (BRD-specified)',
    example: ['Legal Officer', 'Admin'],
    type: [String],
    enum: ['Legal Officer', 'Admin', 'Compliance', 'Lawyer'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(['Legal Officer', 'Admin', 'Compliance', 'Lawyer'], { each: true })
  @IsOptional()
  accessPermissions?: ('Legal Officer' | 'Admin' | 'Compliance' | 'Lawyer')[];

  @ApiProperty({
    description: 'Whether the document is confidential',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  confidentialFlag?: boolean;

  @ApiProperty({
    description: 'Whether the document is public',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({
    description: 'Specific type of case document',
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
    required: false,
  })
  @IsOptional()
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
  caseDocumentType?: string;

  @ApiProperty({
    description: 'Date of the hearing this document is related to',
    example: '2025-08-15',
    type: 'string',
    format: 'date',
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
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  documentDate?: string | null;

  @ApiProperty({
    description: 'Tags or remarks for the document',
    example: ['urgent', 'confidential', 'evidence'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  remarksTags?: string[];
}
