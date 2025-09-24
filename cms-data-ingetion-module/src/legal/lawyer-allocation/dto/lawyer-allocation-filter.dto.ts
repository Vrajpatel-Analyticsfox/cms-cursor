import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class LawyerAllocationFilterDto {
  @ApiProperty({
    description: 'Filter by case ID',
    example: 'uuid-case-id',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  caseId?: string;

  @ApiProperty({
    description: 'Filter by lawyer ID',
    example: 'uuid-lawyer-id',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  lawyerId?: string;

  @ApiProperty({
    description: 'Filter by jurisdiction',
    example: 'Mumbai Sessions Court',
    required: false,
  })
  @IsString()
  @IsOptional()
  jurisdiction?: string;

  @ApiProperty({
    description: 'Filter by lawyer type',
    enum: ['Internal', 'External'],
    example: 'Internal',
    required: false,
  })
  @IsEnum(['Internal', 'External'])
  @IsOptional()
  lawyerType?: 'Internal' | 'External';

  @ApiProperty({
    description: 'Filter by status',
    enum: ['Active', 'Completed', 'Cancelled', 'Reassigned'],
    example: 'Active',
    required: false,
  })
  @IsEnum(['Active', 'Completed', 'Cancelled', 'Reassigned'])
  @IsOptional()
  status?: 'Active' | 'Completed' | 'Cancelled' | 'Reassigned';

  @ApiProperty({
    description: 'Filter by lawyer acknowledgement',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  lawyerAcknowledgement?: boolean;

  @ApiProperty({
    description: 'Filter by reassignment flag',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  reassignmentFlag?: boolean;

  @ApiProperty({
    description: 'Filter by allocation date from',
    example: '2025-07-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  allocationDateFrom?: string;

  @ApiProperty({
    description: 'Filter by allocation date to',
    example: '2025-07-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  allocationDateTo?: string;

  @ApiProperty({
    description: 'Filter by allocated by',
    example: 'Legal Officer',
    required: false,
  })
  @IsString()
  @IsOptional()
  allocatedBy?: string;

  @ApiProperty({
    description: 'Search in remarks',
    example: 'high priority',
    required: false,
  })
  @IsString()
  @IsOptional()
  searchRemarks?: string;
}
