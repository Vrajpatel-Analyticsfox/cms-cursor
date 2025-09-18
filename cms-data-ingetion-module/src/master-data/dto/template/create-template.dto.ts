import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Template type enum matching the database schema
export enum TemplateType {
  PRE_LEGAL = 'Pre-Legal',
  LEGAL = 'Legal',
  FINAL_WARNING = 'Final Warning',
  ARBITRATION = 'Arbitration',
  COURT_SUMMON = 'Court Summon',
}

// Template status enum matching the database schema
export enum TemplateStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class CreateTemplateDto {
  @ApiPropertyOptional({
    description: 'Unique template identifier (auto-generated if not provided)',
    example: 'TEMP001',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  templateId?: string;

  @ApiProperty({
    description: 'Channel ID for the template',
    example: 'uuid-string',
  })
  @IsNotEmpty()
  @IsUUID()
  channelId: string;

  @ApiProperty({
    description: 'Language ID for the template',
    example: 'uuid-string',
  })
  @IsNotEmpty()
  @IsUUID()
  languageId: string;

  @ApiProperty({
    description: 'Name of the template',
    example: 'Custom settlement offer',
  })
  @IsNotEmpty()
  @IsString()
  templateName: string;

  @ApiProperty({
    description: 'Message body content with variables',
    example: 'Hello {{customer_name}}, your EMI is {{amount}}',
  })
  @IsNotEmpty()
  @IsString()
  messageBody: string;

  @ApiProperty({
    description: 'Type of template',
    enum: TemplateType,
    example: TemplateType.PRE_LEGAL,
  })
  @IsNotEmpty()
  @IsEnum(TemplateType)
  templateType: TemplateType;

  @ApiProperty({
    description: 'Status of the template',
    enum: TemplateStatus,
    example: TemplateStatus.ACTIVE,
    default: TemplateStatus.ACTIVE,
  })
  @IsEnum(TemplateStatus)
  status: TemplateStatus = TemplateStatus.ACTIVE;

  @ApiPropertyOptional({
    description: 'Description of the template',
    example: 'Custom settlement offer template',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'User who created the template',
    example: 'admin',
  })
  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
