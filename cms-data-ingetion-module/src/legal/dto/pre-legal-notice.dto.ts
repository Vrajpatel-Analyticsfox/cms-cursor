import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDateString,
  IsInt,
  IsUUID,
  MaxLength,
  ArrayNotEmpty,
} from 'class-validator';

// Enums matching the database schema
export enum TriggerType {
  DPD_THRESHOLD = 'DPD Threshold',
  PAYMENT_FAILURE = 'Payment Failure',
  MANUAL_TRIGGER = 'Manual Trigger',
  BROKEN_PTP = 'Broken PTP',
  ACKNOWLEDGEMENT_PENDING = 'Acknowledgement Pending',
}

export enum NoticeStatus {
  DRAFT = 'Draft',
  GENERATED = 'Generated',
  SENT = 'Sent',
  FAILED = 'Failed',
  ACKNOWLEDGED = 'Acknowledged',
  EXPIRED = 'Expired',
}

export enum CommunicationMode {
  EMAIL = 'Email',
  SMS = 'SMS',
  COURIER_POST = 'Courier/Post',
}

// Request DTO for creating a pre-legal notice
export class CreatePreLegalNoticeDto {
  @ApiProperty({
    description: 'Loan account number of the delinquent borrower',
    example: 'LN4567890',
  })
  @IsString()
  @IsNotEmpty()
  loanAccountNumber: string;

  @ApiProperty({
    description: 'Current DPD (Days Past Due) of the borrower',
    example: 62,
  })
  @IsInt()
  dpdDays: number;

  @ApiProperty({
    description: 'Condition triggering the notice generation',
    enum: TriggerType,
    example: TriggerType.DPD_THRESHOLD,
  })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiProperty({
    description: 'Template ID to be used for generating the notice',
    example: 'uuid-template-id',
  })
  @IsUUID()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({
    description: 'Modes used to send the notice',
    type: [String],
    enum: CommunicationMode,
    example: [CommunicationMode.EMAIL, CommunicationMode.SMS],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(CommunicationMode, { each: true })
  communicationMode: CommunicationMode[];

  @ApiProperty({
    description: 'Notice expiry date (deadline for borrower response)',
    example: '2025-07-28',
  })
  @IsDateString()
  noticeExpiryDate: string;

  @ApiProperty({
    description: 'Name of the legal entity issuing the notice',
    example: 'CollectPro Recovery Services',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  legalEntityName: string;

  @ApiProperty({
    description: 'User ID of the person issuing the notice',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  issuedBy: string;

  @ApiProperty({
    description: 'Whether the borrower must confirm receipt of notice',
    example: true,
  })
  @IsBoolean()
  acknowledgementRequired: boolean;

  @ApiProperty({
    description: 'Current status of the notice',
    enum: NoticeStatus,
    example: NoticeStatus.DRAFT,
  })
  @IsEnum(NoticeStatus)
  noticeStatus: NoticeStatus;

  @ApiPropertyOptional({
    description: 'Any internal remarks or notes',
    example: 'Standard 60-day DPD notice',
    maxLength: 250,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  remarks?: string;
}

// Request DTO for updating notice status
export class UpdateNoticeStatusDto {
  @ApiProperty({
    description: 'Current state of the notice',
    enum: NoticeStatus,
    example: NoticeStatus.SENT,
  })
  @IsEnum(NoticeStatus)
  noticeStatus: NoticeStatus;

  @ApiPropertyOptional({
    description: 'Path to generated PDF document',
    example: '/documents/notices/PLN-20250721-001.pdf',
  })
  @IsOptional()
  @IsString()
  documentPath?: string;

  @ApiPropertyOptional({
    description: 'Updated remarks',
    maxLength: 250,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  remarks?: string;
}

// Response DTO for created notice
export class PreLegalNoticeResponseDto {
  @ApiProperty({
    description: 'Unique notice ID',
    example: 'uuid-notice-id',
  })
  id: string;

  @ApiProperty({
    description: 'Generated notice code',
    example: 'PLN-20250721-001',
  })
  noticeCode: string;

  @ApiProperty({
    description: 'Loan account ID',
    example: 'uuid-loan-account-id',
  })
  loanAccountId: string;

  @ApiProperty({
    description: 'Loan account number',
    example: 'LN4567890',
  })
  loanAccountNumber: string;

  @ApiProperty({
    description: 'Borrower name',
    example: 'Mr. Rohit Sharma',
  })
  borrowerName: string;

  @ApiProperty({
    description: 'Days Past Due',
    example: 62,
  })
  dpdDays: number;

  @ApiProperty({
    description: 'Trigger type',
    enum: TriggerType,
    example: TriggerType.DPD_THRESHOLD,
  })
  triggerType: TriggerType;

  @ApiProperty({
    description: 'Template ID used',
    example: 'uuid-template-id',
  })
  templateId: string;

  @ApiProperty({
    description: 'Template name',
    example: 'Template-60DPD-Standard',
  })
  templateName: string;

  @ApiProperty({
    description: 'Communication modes',
    type: [String],
    example: ['Email', 'SMS'],
  })
  communicationMode: string[];

  @ApiProperty({
    description: 'Notice generation date',
    example: '2025-07-21T10:30:00.000Z',
  })
  noticeGenerationDate: Date;

  @ApiProperty({
    description: 'Notice expiry date',
    example: '2025-07-28',
  })
  noticeExpiryDate: string;

  @ApiProperty({
    description: 'Legal entity name',
    example: 'CollectPro Recovery Services',
  })
  legalEntityName: string;

  @ApiProperty({
    description: 'Issued by user ID',
    example: 'admin',
  })
  issuedBy: string;

  @ApiProperty({
    description: 'Issued by user name',
    example: 'Legal Officer - G. Jain',
  })
  issuedByName: string;

  @ApiProperty({
    description: 'Acknowledgement required flag',
    example: true,
  })
  acknowledgementRequired: boolean;

  @ApiProperty({
    description: 'Current notice status',
    enum: NoticeStatus,
    example: NoticeStatus.DRAFT,
  })
  noticeStatus: NoticeStatus;

  @ApiProperty({
    description: 'Path to generated PDF document',
    example: '/documents/notices/PLN-20250721-001.pdf',
    required: false,
  })
  documentPath?: string;

  @ApiProperty({
    description: 'Remarks',
    example: 'Standard 60-day DPD notice',
    required: false,
  })
  remarks?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-07-21T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-07-21T10:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Created by user',
    example: 'system',
  })
  createdBy: string;
}

// Response DTO for notice list
export class PreLegalNoticeListResponseDto {
  @ApiProperty({
    description: 'Array of pre-legal notices',
    type: [PreLegalNoticeResponseDto],
  })
  notices: PreLegalNoticeResponseDto[];

  @ApiProperty({
    description: 'Total count of notices',
    example: 1,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;
}

// DTO for generating notice preview
export class GenerateNoticePreviewDto {
  @ApiProperty({
    description: 'Template ID to use for preview',
    example: 'uuid-template-id',
  })
  @IsUUID()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({
    description: 'Loan account number for data merge',
    example: 'LN4567890',
  })
  @IsString()
  @IsNotEmpty()
  loanAccountNumber: string;

  @ApiProperty({
    description: 'DPD days for template merge',
    example: 62,
  })
  @IsInt()
  dpdDays: number;

  @ApiProperty({
    description: 'Legal entity name',
    example: 'CollectPro Recovery Services',
  })
  @IsString()
  @IsNotEmpty()
  legalEntityName: string;
}

// Response DTO for notice preview
export class NoticePreviewResponseDto {
  @ApiProperty({
    description: 'Generated HTML content for preview',
    example: '<html>...</html>',
  })
  htmlContent: string;

  @ApiProperty({
    description: 'Template name used',
    example: 'Template-60DPD-Standard',
  })
  templateName: string;

  @ApiProperty({
    description: 'Character count of the notice',
    example: 450,
  })
  characterCount: number;
}

// Query DTO for filtering notices
export class NoticeFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by loan account number',
    example: 'LN4567890',
  })
  @IsOptional()
  @IsString()
  loanAccountNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by notice status',
    enum: NoticeStatus,
    example: NoticeStatus.SENT,
  })
  @IsOptional()
  @IsEnum(NoticeStatus)
  noticeStatus?: NoticeStatus;

  @ApiPropertyOptional({
    description: 'Filter by trigger type',
    enum: TriggerType,
    example: TriggerType.DPD_THRESHOLD,
  })
  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @ApiPropertyOptional({
    description: 'Filter by date from (YYYY-MM-DD)',
    example: '2025-07-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by date to (YYYY-MM-DD)',
    example: '2025-07-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  limit?: number = 10;
}
