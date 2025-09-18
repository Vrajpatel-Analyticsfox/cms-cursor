import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  MaxLength,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { IsFutureOrToday } from '../validators/date-validators';

export class UpdateDocumentDto {
  @ApiProperty({
    description: 'Name/title of the document',
    example: 'Updated Affidavit of Service',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  documentName?: string;

  @ApiProperty({
    description: 'Access permissions for the document',
    example: ['legal-team', 'admin', 'lawyer'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  accessPermissions?: string[];

  @ApiProperty({
    description: 'Whether the document is confidential',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  confidentialFlag?: boolean;

  @ApiProperty({
    description: 'Whether the document is public',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
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
    example: 'Court Order',
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
    example: '2025-09-15',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.hearingDate !== undefined && o.hearingDate !== null && o.hearingDate !== '')
  @IsDateString()
  @IsFutureOrToday({ message: 'Hearing date must be today or later' })
  hearingDate?: string;

  @ApiProperty({
    description: 'Date when the document was created/issued',
    example: '2025-08-01',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  documentDate?: string;

  @ApiProperty({
    description: 'Tags or remarks for the document',
    example: ['updated', 'reviewed', 'approved'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remarksTags?: string[];
}
