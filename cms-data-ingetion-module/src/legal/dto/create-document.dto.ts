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
} from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Type of entity this document is linked to',
    enum: ['Legal Case', 'Legal Notice', 'Loan Account', 'Court Hearing'],
    example: 'Legal Case',
  })
  @IsEnum(['Legal Case', 'Legal Notice', 'Loan Account', 'Court Hearing'])
  @IsNotEmpty()
  linkedEntityType: 'Legal Case' | 'Legal Notice' | 'Loan Account' | 'Court Hearing';

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
    description: 'Access permissions for the document',
    example: ['legal-team', 'admin'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsOptional()
  accessPermissions?: string[];

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
  @IsDateString()
  hearingDate?: string;

  @ApiProperty({
    description: 'Date when the document was created/issued',
    example: '2025-07-21',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  documentDate?: string;

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
