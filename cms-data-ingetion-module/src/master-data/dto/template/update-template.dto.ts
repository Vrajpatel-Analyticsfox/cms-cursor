import { IsOptional, IsString, IsEnum, IsUUID, IsNumber, Min } from 'class-validator';
import { TemplateType, TemplateStatus } from './create-template.dto';

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
  @IsEnum(TemplateType)
  templateType?: TemplateType;

  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
