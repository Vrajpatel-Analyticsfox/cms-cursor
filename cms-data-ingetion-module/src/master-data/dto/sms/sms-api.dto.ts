import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class SmsApiResponse<T = any> {
  @ApiProperty({ description: 'Error code from SMS API', example: 0 })
  ErrorCode: number;

  @ApiProperty({ description: 'Error description from SMS API', example: 'Success' })
  ErrorDescription: string;

  @ApiPropertyOptional({ description: 'Response data from SMS API' })
  Data: T | null;
}

export class SmsTemplate {
  @ApiProperty({ description: 'Template ID from SMS API', example: 84 })
  TemplateId: number;

  @ApiProperty({ description: 'Company ID', example: 14 })
  CompanyId: number;

  @ApiProperty({ description: 'Template name', example: 'First Bounce Intimation' })
  TemplateName: string;

  @ApiProperty({
    description: 'Message template content',
    example: 'Dear {#var#} Your EMI for Rs. {#var#} is bounced.',
  })
  MessageTemplate: string;

  @ApiProperty({ description: 'Whether template is approved', example: true })
  IsApproved: boolean;

  @ApiProperty({ description: 'Whether template is active', example: true })
  IsActive: boolean;

  @ApiProperty({ description: 'Created date', example: '08-Aug-2025' })
  CreatededDate: string;

  @ApiProperty({ description: 'Approved date', example: '11-Aug-2025' })
  ApprovedDate: string;

  @ApiProperty({ description: 'DLT Template ID', example: '1707160889381454203' })
  DltTemplateId: string;
}

export class CreateSmsTemplateRequest {
  @ApiProperty({ description: 'Template name', example: 'Developer test new' })
  @IsString()
  templateName: string;

  @ApiProperty({
    description: 'Message template content',
    example: 'LEGAL WARNING Dear {#var#} A Notice under Section 138',
  })
  @IsString()
  messageTemplate: string;

  @ApiProperty({ description: 'Template ID (will be auto-generated)', example: 'temp' })
  @IsString()
  templateId: string;

  @ApiProperty({ description: 'API Key for SMS service', example: 'xxxxxxxxxxxxxx' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'Client ID for SMS service', example: 'yyyyyyyyyyyyy' })
  @IsString()
  clientId: string;
}

export class UpdateSmsTemplateRequest {
  @ApiProperty({ description: 'Template name', example: 'Updated Template Name' })
  @IsString()
  templateName: string;

  @ApiProperty({ description: 'Message template content', example: 'Updated message content' })
  @IsString()
  messageTemplate: string;

  @ApiProperty({ description: 'Template ID', example: 'UpdatedTempId' })
  @IsString()
  templateId: string;

  @ApiProperty({ description: 'API Key for SMS service', example: 'xxxxxxxxxxxxxx' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'Client ID for SMS service', example: 'yyyyyyyyyyyyy' })
  @IsString()
  clientId: string;
}

export class SmsTemplateQueryParams {
  @ApiProperty({ description: 'API Key for SMS service', example: 'xxxxxxxxxxxxxx' })
  @IsString()
  ApiKey: string;

  @ApiProperty({ description: 'Client ID for SMS service', example: 'yyyyyyyyyyyyy' })
  @IsString()
  ClientId: string;

  @ApiPropertyOptional({ description: 'Template ID for delete operation', example: 133 })
  @IsOptional()
  @IsNumber()
  id?: number;
}
