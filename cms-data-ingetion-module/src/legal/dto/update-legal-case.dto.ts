import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  MaxLength,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { IsFutureOrToday, IsAfterOrEqualDate } from '../validators/date-validators';

export class UpdateLegalCaseDto {
  @ApiProperty({
    description: 'Type of legal case initiated',
    enum: ['Civil', 'Criminal', 'Arbitration', '138 Bounce', 'SARFAESI'],
    example: 'Civil',
    required: false,
  })
  @IsOptional()
  @IsEnum(['Civil', 'Criminal', 'Arbitration', '138 Bounce', 'SARFAESI'])
  caseType?: 'Civil' | 'Criminal' | 'Arbitration' | '138 Bounce' | 'SARFAESI';

  @ApiProperty({
    description: 'Court where the case is filed',
    example: 'Mumbai Sessions Court',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  courtName?: string;

  @ApiProperty({
    description: 'Date of formal case filing',
    example: '2025-07-21',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  caseFiledDate?: string;

  @ApiProperty({
    description: 'ID of the lawyer assigned to the case',
    example: 'uuid-lawyer-id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  lawyerAssignedId?: string;

  @ApiProperty({
    description: 'Court location/state/district',
    example: 'Mumbai, Maharashtra',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  filingJurisdiction?: string;

  @ApiProperty({
    description: 'Present legal state of the case',
    enum: ['Filed', 'Under Trial', 'Stayed', 'Dismissed', 'Resolved', 'Closed'],
    example: 'Under Trial',
    required: false,
  })
  @IsOptional()
  @IsEnum(['Filed', 'Under Trial', 'Stayed', 'Dismissed', 'Resolved', 'Closed'])
  currentStatus?: 'Filed' | 'Under Trial' | 'Stayed' | 'Dismissed' | 'Resolved' | 'Closed';

  @ApiProperty({
    description: 'Scheduled date for next hearing',
    example: '2025-08-15',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.nextHearingDate !== undefined && o.nextHearingDate !== null && o.nextHearingDate !== '',
  )
  @IsDateString()
  @IsFutureOrToday({ message: 'Next hearing date must be today or later' })
  nextHearingDate?: string | null;

  @ApiProperty({
    description: 'Remarks or decisions from last hearing',
    example: 'Case adjourned to next hearing date',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lastHearingOutcome?: string | null;

  @ApiProperty({
    description: 'If case resulted in any recovery action',
    enum: ['Repossession', 'Settlement', 'Warrant Issued', 'None'],
    example: 'Settlement',
    required: false,
  })
  @IsOptional()
  @IsEnum(['Repossession', 'Settlement', 'Warrant Issued', 'None'])
  recoveryActionLinked?: 'Repossession' | 'Settlement' | 'Warrant Issued' | 'None' | null;

  @ApiProperty({
    description: 'Internal notes for tracking',
    example: 'Case progressing well, next hearing scheduled',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caseRemarks?: string | null;

  @ApiProperty({
    description: 'Date on which case was officially closed',
    example: '2025-12-31',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.caseClosureDate !== undefined && o.caseClosureDate !== null && o.caseClosureDate !== '',
  )
  @IsDateString()
  @ValidateIf((o) => o.currentStatus === 'Closed' || o.currentStatus === 'Resolved')
  @IsAfterOrEqualDate('caseFiledDate', {
    message: 'Case closure date must be greater than or equal to case filed date',
  })
  caseClosureDate?: string | null;

  @ApiProperty({
    description: 'Final decision or resolution notes',
    example: 'Case resolved through settlement agreement',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  outcomeSummary?: string | null;
}
