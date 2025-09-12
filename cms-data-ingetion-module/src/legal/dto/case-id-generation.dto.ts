import { IsString, IsOptional, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CaseIdGenerationRequestDto {
  @ApiProperty({
    description: 'Prefix for the case ID (e.g., "LC" for Legal Case)',
    example: 'LC',
    minLength: 2,
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Prefix must contain only uppercase letters and numbers',
  })
  prefix: string;

  @ApiProperty({
    description: 'Optional category code (e.g., "MIC" for Microfinance, "CON" for Consumer Loan)',
    example: 'MIC',
    required: false,
    minLength: 2,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Category code must contain only uppercase letters and numbers',
  })
  categoryCode?: string;

  @ApiProperty({
    description: 'User/system who is creating the case',
    example: 'legal_officer_001',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  createdBy: string;
}

export class CaseIdGenerationResponseDto {
  @ApiProperty({
    description: 'Generated case ID',
    example: 'LC-20250721-MIC-0001',
  })
  caseId: string;

  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Case ID generated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Prefix used in case ID generation',
    example: 'LC',
    required: false,
  })
  prefix?: string;

  @ApiProperty({
    description: 'Date stamp used in case ID generation',
    example: '20250721',
    required: false,
  })
  dateStamp?: string;

  @ApiProperty({
    description: 'Category code used in case ID generation',
    example: 'MIC',
    required: false,
  })
  categoryCode?: string;

  @ApiProperty({
    description: 'Sequence number used in case ID generation',
    example: 1,
    required: false,
  })
  sequenceNumber?: number;

  @ApiProperty({
    description: 'Whether the generated case ID is unique',
    example: true,
    required: false,
  })
  isUnique?: boolean;

  @ApiProperty({
    description: 'Format pattern used for case ID generation',
    example: 'PREFIX-YYYYMMDD-CATEGORY-SEQUENCE',
    required: false,
  })
  format?: string;
}

export class SequenceInfoDto {
  @ApiProperty({
    description: 'Sequence record ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Prefix for the sequence',
    example: 'LC',
  })
  prefix: string;

  @ApiProperty({
    description: 'Category code (if any)',
    example: 'MIC',
    required: false,
  })
  categoryCode?: string;

  @ApiProperty({
    description: 'Date for sequence tracking',
    example: '2025-07-21',
  })
  sequenceDate: string;

  @ApiProperty({
    description: 'Current sequence number',
    example: 23,
  })
  currentSequence: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-07-21T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-07-21T10:00:00Z',
  })
  updatedAt: string;
}

export class CurrentSequenceResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Sequence information retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Sequence information',
    type: SequenceInfoDto,
    required: false,
  })
  sequence: SequenceInfoDto | null;
}

export class SequenceResetResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Sequence reset successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  success: boolean;
}

export class AllSequencesResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'All sequence records retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Number of sequence records',
    example: 5,
  })
  count: number;

  @ApiProperty({
    description: 'Array of sequence records',
    type: [SequenceInfoDto],
  })
  sequences: SequenceInfoDto[];
}

export class CaseIdValidationResponseDto {
  @ApiProperty({
    description: 'Case ID that was validated',
    example: 'LC-20250721-MIC-0001',
  })
  caseId: string;

  @ApiProperty({
    description: 'Whether the case ID is unique',
    example: true,
  })
  isUnique: boolean;

  @ApiProperty({
    description: 'Validation message',
    example: 'Case ID is unique and available',
  })
  message: string;
}

export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'Service status',
    example: 'healthy',
  })
  status: string;

  @ApiProperty({
    description: 'Current timestamp',
    example: '2025-07-21T10:00:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Case ID Generation Service',
  })
  service: string;
}
