import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TriggerType {
  DPD_THRESHOLD = 'DPD_THRESHOLD',
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',
  MANUAL_TRIGGER = 'MANUAL_TRIGGER',
}

export enum SeverityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum EligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

export class ManualTriggerDetectionDto {
  @ApiProperty({
    description: 'Specific loan account numbers to check (optional)',
    example: ['LN4567890', 'LN7890123'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accountNumbers?: string[];

  @ApiProperty({
    description: 'Types of triggers to detect',
    example: ['DPD_THRESHOLD', 'PAYMENT_FAILURE'],
    enum: TriggerType,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TriggerType, { each: true })
  triggerTypes?: TriggerType[];

  @ApiProperty({
    description: 'Force detection even if recent triggers exist',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  forceDetection?: boolean;
}

export class TriggerEventDto {
  @ApiProperty({
    description: 'Unique trigger event ID',
    example: 'dpd-12345-1642678800000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Loan account ID',
    example: 'uuid-loan-account-id',
  })
  @IsString()
  loanAccountId: string;

  @ApiProperty({
    description: 'Loan account number',
    example: 'LN4567890',
  })
  @IsString()
  loanAccountNumber: string;

  @ApiProperty({
    description: 'Borrower name',
    example: 'Mr. Rajesh Kumar Singh',
  })
  @IsString()
  borrowerName: string;

  @ApiProperty({
    description: 'Type of trigger detected',
    enum: TriggerType,
    example: TriggerType.DPD_THRESHOLD,
  })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiProperty({
    description: 'Current DPD days',
    example: 65,
  })
  @IsNumber()
  dpdDays: number;

  @ApiProperty({
    description: 'Outstanding amount',
    example: 387500.0,
  })
  @IsNumber()
  outstandingAmount: number;

  @ApiProperty({
    description: 'Last payment date',
    example: '2024-10-15T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  lastPaymentDate?: string;

  @ApiProperty({
    description: 'Trigger detection timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  @IsDateString()
  detectedAt: string;

  @ApiProperty({
    description: 'Severity level of the trigger',
    enum: SeverityLevel,
    example: SeverityLevel.MEDIUM,
  })
  @IsEnum(SeverityLevel)
  severity: SeverityLevel;

  @ApiProperty({
    description: 'Eligibility status for notice generation',
    enum: EligibilityStatus,
    example: EligibilityStatus.ELIGIBLE,
  })
  @IsEnum(EligibilityStatus)
  eligibilityStatus: EligibilityStatus;

  @ApiProperty({
    description: 'Additional metadata about the trigger',
    example: {
      productType: 'Personal Loan',
      branchCode: 'MBC001',
      thresholdBreached: '60-89',
    },
  })
  metadata: Record<string, any>;
}

export class TriggerDetectionResultDto {
  @ApiProperty({
    description: 'Total number of triggers detected',
    example: 15,
  })
  @IsNumber()
  totalTriggered: number;

  @ApiProperty({
    description: 'Accounts eligible for notice generation',
    type: [TriggerEventDto],
  })
  @IsArray()
  eligibleAccounts: TriggerEventDto[];

  @ApiProperty({
    description: 'Accounts ineligible for notice generation',
    type: [TriggerEventDto],
  })
  @IsArray()
  ineligibleAccounts: TriggerEventDto[];

  @ApiProperty({
    description: 'Errors encountered during detection',
    example: [
      {
        accountNumber: 'LN999999',
        error: 'Account not found',
      },
    ],
  })
  @IsArray()
  errors: Array<{ accountNumber: string; error: string }>;

  @ApiProperty({
    description: 'Total execution time in milliseconds',
    example: 2345,
  })
  @IsNumber()
  executionTime: number;
}

export class TriggerStatisticsDto {
  @ApiProperty({
    description: 'Statistics period',
    example: 'Last 7 days',
  })
  @IsString()
  period: string;

  @ApiProperty({
    description: 'Trigger statistics by type and severity',
    example: [
      {
        triggerType: 'dpd-threshold',
        severity: 'medium',
        count: 25,
      },
    ],
  })
  @IsArray()
  statistics: Array<{
    triggerType: string;
    severity: string;
    count: number;
  }>;

  @ApiProperty({
    description: 'Total triggers in the period',
    example: 45,
  })
  @IsNumber()
  totalTriggers: number;
}

export class TriggerDetectionRequestDto {
  @ApiProperty({
    description: 'Detection mode',
    example: 'MANUAL',
    enum: ['AUTOMATED', 'MANUAL'],
  })
  @IsEnum(['AUTOMATED', 'MANUAL'])
  mode: 'AUTOMATED' | 'MANUAL';

  @ApiProperty({
    description: 'Detection parameters',
    type: ManualTriggerDetectionDto,
    required: false,
  })
  @IsOptional()
  parameters?: ManualTriggerDetectionDto;

  @ApiProperty({
    description: 'User initiating the detection',
    example: 'legal_officer_001',
  })
  @IsString()
  initiatedBy: string;
}

export class TriggerDetectionResponseDto {
  @ApiProperty({
    description: 'Detection result',
    type: TriggerDetectionResultDto,
  })
  result: TriggerDetectionResultDto;

  @ApiProperty({
    description: 'Detection metadata',
    example: {
      mode: 'MANUAL',
      initiatedBy: 'legal_officer_001',
      timestamp: '2025-01-15T10:30:00Z',
    },
  })
  metadata: {
    mode: string;
    initiatedBy: string;
    timestamp: string;
  };

  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Trigger detection completed successfully',
  })
  @IsString()
  message: string;
}
