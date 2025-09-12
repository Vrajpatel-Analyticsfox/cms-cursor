import { IsOptional, IsString, IsEnum, IsUUID, IsNumber, Min } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsUUID()
  channelId?: string;

  @IsOptional()
  @IsUUID()
  languageId?: string;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  messageBody?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCharacters?: number;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: 'active' | 'inactive' | 'draft';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
