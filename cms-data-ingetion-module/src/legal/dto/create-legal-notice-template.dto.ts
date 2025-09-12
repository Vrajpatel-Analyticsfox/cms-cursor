import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class CreateLegalNoticeTemplateDto {
  @IsString()
  @MaxLength(50)
  templateCode: string;

  @IsString()
  @MaxLength(100)
  templateName: string;

  @IsEnum(['Pre-Legal', 'Legal', 'Final Warning', 'Arbitration', 'Court Summon'])
  templateType: 'Pre-Legal' | 'Legal' | 'Final Warning' | 'Arbitration' | 'Court Summon';

  @IsString()
  templateContent: string;

  @IsUUID()
  languageId: string;

  @IsOptional()
  @IsNumber()
  maxCharacters?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsString()
  createdBy?: string;
}
