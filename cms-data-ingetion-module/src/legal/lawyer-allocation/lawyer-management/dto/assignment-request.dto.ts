import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';

export class AssignmentRequestDto {
  @ApiProperty({
    description: 'Case ID to assign lawyer to',
    example: 'uuid-case-id',
  })
  @IsUUID()
  @IsNotEmpty()
  caseId: string;

  @ApiProperty({
    description: 'Type of case',
    enum: ['Civil', 'Criminal', 'Arbitration', '138 Bounce', 'SARFAESI'],
    example: 'Civil',
  })
  @IsEnum(['Civil', 'Criminal', 'Arbitration', '138 Bounce', 'SARFAESI'])
  @IsNotEmpty()
  caseType: 'Civil' | 'Criminal' | 'Arbitration' | '138 Bounce' | 'SARFAESI';

  @ApiProperty({
    description: 'Jurisdiction where the case is filed',
    example: 'Mumbai, Maharashtra',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  jurisdiction: string;

  @ApiProperty({
    description: 'Preferred specialization for the lawyer',
    example: 'Civil Law',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  specialization?: string;

  @ApiProperty({
    description: 'Priority level of the case',
    enum: ['high', 'medium', 'low'],
    example: 'medium',
    required: false,
  })
  @IsEnum(['high', 'medium', 'low'])
  @IsOptional()
  priority?: 'high' | 'medium' | 'low' = 'medium';

  @ApiProperty({
    description: 'Lawyer IDs to exclude from assignment',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  excludeLawyerIds?: string[];
}
