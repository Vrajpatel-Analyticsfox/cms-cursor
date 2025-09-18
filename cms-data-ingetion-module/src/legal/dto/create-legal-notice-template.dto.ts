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
  templateId: string;

  @IsString()
  @MaxLength(100)
  templateName: string;

  @IsEnum(['Pre-Legal', 'Legal', 'Final Warning', 'Arbitration', 'Court Summon'])
  templateType: 'Pre-Legal' | 'Legal' | 'Final Warning' | 'Arbitration' | 'Court Summon';

  @IsString()
  messageBody: string;

  @IsUUID()
  languageId: string;

  @IsUUID()
  channelId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';

  @IsOptional()
  @IsString()
  createdBy?: string;
}
