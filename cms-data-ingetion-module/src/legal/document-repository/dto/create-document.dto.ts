import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

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
    example: 'entity-id-123',
  })
  @IsString()
  @IsNotEmpty()
  linkedEntityId: string;

  @ApiProperty({
    description: 'Name/title of the document (BRD: Max 100 characters)',
    example: 'Affidavit of Service',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentName: string;

  @ApiProperty({
    description: 'Classification of document (BRD-specified)',
    example: 'Legal Notice',
    enum: ['Legal Notice', 'Court Order', 'Affidavit', 'Case Summary', 'Proof', 'Other'],
  })
  @IsEnum(['Legal Notice', 'Court Order', 'Affidavit', 'Case Summary', 'Proof', 'Other'])
  @IsNotEmpty()
  documentType: 'Legal Notice' | 'Court Order' | 'Affidavit' | 'Case Summary' | 'Proof' | 'Other';

  @ApiProperty({
    description: 'Access permissions for the document (BRD-specified)',
    example: ['Legal Officer', 'Admin'],
    type: [String],
    enum: ['Legal Officer', 'Admin', 'Compliance', 'Lawyer'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(['Legal Officer', 'Admin', 'Compliance', 'Lawyer'], { each: true })
  @IsNotEmpty()
  accessPermissions: ('Legal Officer' | 'Admin' | 'Compliance' | 'Lawyer')[];

  @ApiProperty({
    description: 'Whether the document is confidential (BRD-specified)',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  confidentialFlag?: boolean;

  @ApiProperty({
    description: 'Tags or remarks for the document (BRD: Max 250 characters)',
    example: 'urgent, confidential, evidence',
    maxLength: 250,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  remarksTags?: string;
}
