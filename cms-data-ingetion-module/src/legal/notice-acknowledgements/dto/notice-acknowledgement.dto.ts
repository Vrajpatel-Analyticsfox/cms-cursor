import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  IsUUID,
} from 'class-validator';

// Enums for validation
export enum AcknowledgedByEnum {
  BORROWER = 'Borrower',
  FAMILY_MEMBER = 'Family Member',
  LAWYER = 'Lawyer',
  SECURITY_GUARD = 'Security Guard',
  REFUSED = 'Refused',
}

export enum AcknowledgementModeEnum {
  IN_PERSON = 'In Person',
  COURIER_RECEIPT = 'Courier Receipt',
  EMAIL = 'Email',
  SMS = 'SMS',
  PHONE_CALL = 'Phone Call',
}

export enum NoticeTypeEnum {
  PRE_LEGAL = 'Pre-Legal',
  LEGAL = 'Legal',
}

export enum AcknowledgementStatusEnum {
  ACKNOWLEDGED = 'Acknowledged',
  REFUSED = 'Refused',
  PENDING_VERIFICATION = 'Pending Verification',
}

// Create Acknowledgement DTO (for JSON requests)
export class CreateNoticeAcknowledgementDto {
  @ApiProperty({
    description: 'ID of the legal notice being acknowledged',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  noticeId: string;

  @ApiProperty({
    description: 'Borrower name',
    example: 'Vraj',
  })
  @IsString()
  @IsNotEmpty()
  borrowerName: string;

  @ApiProperty({
    description: 'Who acknowledged the notice',
    enum: AcknowledgedByEnum,
    example: 'Family Member',
  })
  @IsEnum(AcknowledgedByEnum)
  @IsNotEmpty()
  acknowledgedBy: string;

  @ApiPropertyOptional({
    description: 'Relationship to borrower if not the borrower themselves',
    example: 'Spouse',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationshipToBorrower?: string;

  @ApiProperty({
    description: 'Date and time when the notice was acknowledged',
    example: '2025-07-20T16:30:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  acknowledgementDate: string;

  @ApiProperty({
    description: 'Mode of acknowledgement',
    enum: AcknowledgementModeEnum,
    example: 'In Person',
  })
  @IsEnum(AcknowledgementModeEnum)
  @IsNotEmpty()
  acknowledgementMode: string;

  @ApiPropertyOptional({
    description: 'File path to proof of acknowledgement (uploaded file)',
    example: '/uploads/acknowledgements/signature_slip_20250720.pdf',
  })
  @IsOptional()
  @IsString()
  proofOfAcknowledgement?: string;

  @ApiPropertyOptional({
    description: 'Additional remarks or details',
    example: 'Notice acknowledged by spouse in presence of security guard',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiProperty({
    description: 'User or role who captured the acknowledgement',
    example: 'Field Executive - Mumbai Team',
  })
  @IsString()
  @IsNotEmpty()
  capturedBy: string;

  @ApiPropertyOptional({
    description: 'Geographic location coordinates if field-collected',
    example: '19.0760,72.8777',
  })
  @IsOptional()
  @IsString()
  geoLocation?: string;

  @ApiProperty({
    description: 'User who created the acknowledgement',
    example: 'Legal Officer',
  })
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

// Create Acknowledgement with Document DTO (for multipart form data)
export class CreateNoticeAcknowledgementWithDocumentDto {
  @ApiProperty({
    description: 'ID of the legal notice being acknowledged',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  noticeId: string;

  @ApiProperty({
    description: 'Borrower name',
    example: 'Vraj',
  })
  @IsString()
  @IsNotEmpty()
  borrowerName: string;

  @ApiProperty({
    description: 'Who acknowledged the notice',
    enum: AcknowledgedByEnum,
    example: 'Family Member',
  })
  @IsEnum(AcknowledgedByEnum)
  @IsNotEmpty()
  acknowledgedBy: string;

  @ApiPropertyOptional({
    description: 'Relationship to borrower if not the borrower themselves',
    example: 'Spouse',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationshipToBorrower?: string;

  @ApiProperty({
    description: 'Date and time when the notice was acknowledged',
    example: '2025-07-20T16:30:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  acknowledgementDate: string;

  @ApiProperty({
    description: 'Mode of acknowledgement',
    enum: AcknowledgementModeEnum,
    example: 'In Person',
  })
  @IsEnum(AcknowledgementModeEnum)
  @IsNotEmpty()
  acknowledgementMode: string;

  @ApiPropertyOptional({
    description: 'Additional remarks or details',
    example: 'Notice acknowledged by spouse in presence of security guard',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiProperty({
    description: 'User or role who captured the acknowledgement',
    example: 'Field Executive - Mumbai Team',
  })
  @IsString()
  @IsNotEmpty()
  capturedBy: string;

  @ApiPropertyOptional({
    description: 'Geographic location coordinates if field-collected',
    example: '19.0760,72.8777',
  })
  @IsOptional()
  @IsString()
  geoLocation?: string;

  @ApiProperty({
    description: 'User who created the acknowledgement',
    example: 'Legal Officer',
  })
  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty({
    description: 'Proof document file (PDF, JPG, PNG, DOCX)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  file?: Express.Multer.File;
}

// Update Acknowledgement DTO
export class UpdateNoticeAcknowledgementDto {
  @ApiPropertyOptional({
    description: 'Who acknowledged the notice',
    enum: AcknowledgedByEnum,
    example: 'Borrower',
  })
  @IsOptional()
  @IsEnum(AcknowledgedByEnum)
  acknowledgedBy?: string;

  @ApiPropertyOptional({
    description: 'Relationship to borrower if not the borrower themselves',
    example: 'Son',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationshipToBorrower?: string;

  @ApiPropertyOptional({
    description: 'Date and time when the notice was acknowledged',
    example: '2025-07-20T16:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  acknowledgementDate?: string;

  @ApiPropertyOptional({
    description: 'Mode of acknowledgement',
    enum: AcknowledgementModeEnum,
    example: 'Courier Receipt',
  })
  @IsOptional()
  @IsEnum(AcknowledgementModeEnum)
  acknowledgementMode?: string;

  @ApiPropertyOptional({
    description: 'File path to proof of acknowledgement (uploaded file)',
    example: '/uploads/acknowledgements/delivery_receipt_20250720.pdf',
  })
  @IsOptional()
  @IsString()
  proofOfAcknowledgement?: string;

  @ApiPropertyOptional({
    description: 'Additional remarks or details',
    example: 'Updated with delivery receipt proof',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Geographic location coordinates if field-collected',
    example: '19.0760,72.8777',
  })
  @IsOptional()
  @IsString()
  geoLocation?: string;

  @ApiPropertyOptional({
    description: 'Acknowledgement status',
    enum: AcknowledgementStatusEnum,
    example: 'Acknowledged',
  })
  @IsOptional()
  @IsEnum(AcknowledgementStatusEnum)
  acknowledgementStatus?: string;

  @ApiProperty({
    description: 'User who updated the acknowledgement',
    example: 'Legal Officer - John Smith',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  updatedBy: string;
}

// Response DTO
export class NoticeAcknowledgementResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Auto-generated acknowledgement ID',
    example: 'ACKN-20250721-0008',
  })
  acknowledgementId: string;

  @ApiProperty({ description: 'Notice ID', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  noticeId: string;

  @ApiProperty({ description: 'Notice Code', example: 'PLN-20250721-0001' })
  noticeCode: string;

  @ApiProperty({ description: 'Loan account number', example: 'LN4567890' })
  loanAccountNumber: string;

  @ApiProperty({ description: 'Borrower name', example: 'Rajiv Menon' })
  borrowerName: string;

  @ApiProperty({ description: 'Notice type', example: 'Pre-Legal' })
  noticeType: string;

  @ApiProperty({ description: 'Who acknowledged the notice', example: 'Family Member' })
  acknowledgedBy: string;

  @ApiPropertyOptional({ description: 'Relationship to borrower', example: 'Spouse' })
  relationshipToBorrower?: string;

  @ApiProperty({ description: 'Acknowledgement date', example: '2025-07-20T16:30:00Z' })
  acknowledgementDate: Date;

  @ApiProperty({ description: 'Acknowledgement mode', example: 'In Person' })
  acknowledgementMode: string;

  @ApiPropertyOptional({
    description: 'Proof of acknowledgement file path',
    example: '/uploads/acknowledgements/signature_slip.pdf',
  })
  proofOfAcknowledgement?: string;

  @ApiPropertyOptional({ description: 'Remarks', example: 'Notice acknowledged by spouse' })
  remarks?: string;

  @ApiProperty({ description: 'Captured by', example: 'Field Executive - Mumbai Team' })
  capturedBy: string;

  @ApiPropertyOptional({ description: 'Geographic location', example: '19.0760,72.8777' })
  geoLocation?: string;

  @ApiProperty({ description: 'Acknowledgement status', example: 'Acknowledged' })
  acknowledgementStatus: string;

  @ApiProperty({ description: 'Created at', example: '2025-07-21T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2025-07-21T10:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by', example: 'system' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Updated by', example: 'admin@company.com' })
  updatedBy?: string;
}

// Filter DTO
export class NoticeAcknowledgementFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by notice ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  noticeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by loan account number',
    example: 'LN4567890',
  })
  @IsOptional()
  @IsString()
  loanAccountNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by borrower name',
    example: 'Rajiv Menon',
  })
  @IsOptional()
  @IsString()
  borrowerName?: string;

  @ApiPropertyOptional({
    description: 'Filter by notice type',
    enum: NoticeTypeEnum,
    example: 'Pre-Legal',
  })
  @IsOptional()
  @IsEnum(NoticeTypeEnum)
  noticeType?: string;

  @ApiPropertyOptional({
    description: 'Filter by acknowledged by',
    enum: AcknowledgedByEnum,
    example: 'Family Member',
  })
  @IsOptional()
  @IsEnum(AcknowledgedByEnum)
  acknowledgedBy?: string;

  @ApiPropertyOptional({
    description: 'Filter by acknowledgement mode',
    enum: AcknowledgementModeEnum,
    example: 'In Person',
  })
  @IsOptional()
  @IsEnum(AcknowledgementModeEnum)
  acknowledgementMode?: string;

  @ApiPropertyOptional({
    description: 'Filter by acknowledgement status',
    enum: AcknowledgementStatusEnum,
    example: 'Acknowledged',
  })
  @IsOptional()
  @IsEnum(AcknowledgementStatusEnum)
  acknowledgementStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by captured by',
    example: 'Field Executive',
  })
  @IsOptional()
  @IsString()
  capturedBy?: string;

  @ApiPropertyOptional({
    description: 'Filter acknowledgements from this date (ISO 8601 format)',
    example: '2025-07-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter acknowledgements up to this date (ISO 8601 format)',
    example: '2025-07-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

// File Upload DTO
export class UploadProofDto {
  @ApiProperty({
    description: 'Acknowledgement ID to attach proof to',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  acknowledgementId: string;

  @ApiProperty({
    description: 'File type/format',
    example: 'PDF',
  })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'signature_slip.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsNotEmpty()
  fileSize: number;
}
