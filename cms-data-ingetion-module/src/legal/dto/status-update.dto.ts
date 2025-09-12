import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';

export class StatusUpdateDto {
  @ApiProperty({
    description: 'New status for the case',
    enum: ['Filed', 'Under Trial', 'Stayed', 'Dismissed', 'Resolved', 'Closed'],
    example: 'Under Trial',
  })
  @IsEnum(['Filed', 'Under Trial', 'Stayed', 'Dismissed', 'Resolved', 'Closed'])
  @IsNotEmpty()
  newStatus: 'Filed' | 'Under Trial' | 'Stayed' | 'Dismissed' | 'Resolved' | 'Closed';

  @ApiProperty({
    description: 'Reason for status change',
    example: 'Case proceedings have begun in court',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    description: 'Next hearing date (required for Under Trial status)',
    example: '2025-08-15',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  nextHearingDate?: string;

  @ApiProperty({
    description: 'Outcome of the last hearing',
    example: 'Case adjourned to next hearing date',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  lastHearingOutcome?: string;

  @ApiProperty({
    description: 'Case closure date (required for Closed status)',
    example: '2025-12-31',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  caseClosureDate?: string;

  @ApiProperty({
    description: 'Summary of case outcome',
    example: 'Case resolved through settlement agreement',
    maxLength: 1000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  outcomeSummary?: string;
}

