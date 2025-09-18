import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateDpdBucketDto {
  @ApiProperty({
    description: 'Unique bucket identifier',
    example: 'BUCKET_001',
    minLength: 3,
    maxLength: 50,
    pattern: '^[A-Z0-9_]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Bucket ID must contain only uppercase letters, numbers, and underscores',
  })
  bucketId: string;

  @ApiProperty({
    description: 'Descriptive name for the DPD bucket',
    example: 'Early Delinquency',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  bucketName: string;

  @ApiProperty({
    description: 'Starting day of the DPD range (can be negative for early payments)',
    example: -3,
    minimum: -10,
    maximum: 10,
  })
  @IsNumber()
  @Min(-10)
  @Max(10)
  rangeStart: number;

  @ApiProperty({
    description: 'Ending day of the DPD range',
    example: 0,
    minimum: -10,
    maximum: 10,
  })
  @IsNumber()
  @Min(-10)
  @Max(10)
  rangeEnd: number;

  @ApiPropertyOptional({
    description: 'Minimum days for this bucket',
    example: 0,
    minimum: 0,
    maximum: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  @Transform(({ value }) => value)
  minDays?: number;

  @ApiPropertyOptional({
    description: 'Maximum days for this bucket',
    example: 30,
    minimum: 0,
    maximum: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  @Transform(({ value }) => value)
  maxDays?: number;

  @ApiProperty({
    description: 'Module or collection strategy this bucket belongs to',
    example: 'Digital',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  module: string;

  @ApiProperty({
    description: 'Bucket status',
    enum: ['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'],
    example: 'Active',
    default: 'Active',
  })
  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  @IsOptional()
  status?: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled';

  @ApiPropertyOptional({
    description: 'Additional description or notes about the bucket',
    example: 'Early stage delinquency bucket for digital collections',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiProperty({
    description: 'User who created the bucket',
    example: 'admin',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  createdBy: string;
}
