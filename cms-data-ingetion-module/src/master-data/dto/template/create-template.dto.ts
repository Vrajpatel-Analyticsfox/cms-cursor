import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  templateId: string;

  @IsNotEmpty()
  @IsUUID()
  channelId: string;

  @IsNotEmpty()
  @IsUUID()
  languageId: string;

  @IsNotEmpty()
  @IsString()
  templateName: string;

  @IsNotEmpty()
  @IsString()
  messageBody: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxCharacters: number;

  @IsEnum(['active', 'inactive', 'draft'])
  status: 'active' | 'inactive' | 'draft' = 'active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
