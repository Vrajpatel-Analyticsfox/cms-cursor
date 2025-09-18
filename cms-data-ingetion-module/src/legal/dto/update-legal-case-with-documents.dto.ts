import { PartialType } from '@nestjs/swagger';
import {
  CreateLegalCaseWithDocumentsDto,
  DocumentUploadDto,
} from './create-legal-case-with-documents.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateLegalCaseWithDocumentsDto extends PartialType(CreateLegalCaseWithDocumentsDto) {
  @ApiProperty({
    description: 'Documents to add to the case',
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
  documentsToAdd?: DocumentUploadDto[];

  @ApiProperty({
    description: 'Document IDs to remove from the case',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
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
  documentsToRemove?: string[];
}
