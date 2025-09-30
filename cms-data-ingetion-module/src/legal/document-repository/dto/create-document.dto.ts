import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Type of entity this document is linked to (BRD-specified)',
    example: 'Case ID',
  })
  @IsString()
  @IsNotEmpty()
  linkedEntityType: string;

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
  })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({
    description: 'Access permissions for the document (BRD-specified)',
    example: ['Legal Officer', 'Admin'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty()
  accessPermissions: string[];

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
