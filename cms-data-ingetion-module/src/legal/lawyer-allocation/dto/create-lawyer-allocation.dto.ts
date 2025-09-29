import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsEnum,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateLawyerAllocationDto {
  @ApiProperty({
    description: 'Legal case to which a lawyer is being assigned',
    example: 'uuid-case-id',
  })
  @IsUUID()
  @IsNotEmpty()
  caseId: string;

  @ApiProperty({
    description: 'Name of the lawyer being assigned',
    example: 'uuid-lawyer-id',
  })
  @IsUUID()
  @IsNotEmpty()
  lawyerId: string;

  @ApiProperty({
    description: 'Location/Court where the case will be heard',
    example: 'Mumbai Sessions Court',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  jurisdiction: string;

  @ApiProperty({
    description: 'Type of lawyer',
    enum: ['Internal', 'External'],
    example: 'Internal',
  })
  @IsEnum(['Internal', 'External'])
  @IsNotEmpty()
  lawyerType: 'Internal' | 'External';

  @ApiProperty({
    description: 'Date of assignment',
    example: '2025-07-21',
  })
  @IsDateString()
  @IsNotEmpty()
  allocationDate: string;

  @ApiProperty({
    description: 'If true, indicates reassignment',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  reassignmentFlag?: boolean = false;

  @ApiProperty({
    description: 'Mandatory only if reassignment is true',
    example: 'Previous lawyer unavailable',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ValidateIf((o) => o.reassignmentFlag === true)
  reassignmentReason?: string;

  @ApiProperty({
    description: 'Additional notes or context',
    example: 'High priority case requiring experienced lawyer',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  remarks?: string;

  @ApiProperty({
    description: 'Status of the allocation',
    enum: ['Active', 'Inactive', 'Reassigned'],
    example: 'Active',
    required: false,
  })
  @IsEnum(['Active', 'Inactive', 'Reassigned'])
  @IsOptional()
  status?: 'Active' | 'Inactive' | 'Reassigned' = 'Active';

  @ApiProperty({
    description: 'Checkbox/flag indicating lawyer has accepted the assignment',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  lawyerAcknowledgement?: boolean = false;

  @ApiProperty({
    description: 'User who created the allocation',
    example: 'Legal Officer - John Smith',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  createdBy: string;
}
