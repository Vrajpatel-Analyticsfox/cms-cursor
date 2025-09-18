import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDpdBucketDto {
  @IsOptional()
  @IsString()
  bucketId?: string;

  @IsOptional()
  @IsString()
  bucketName?: string;

  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  rangeStart?: number;

  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  rangeEnd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  @Transform(({ value }) => value)
  minDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  @Transform(({ value }) => value)
  maxDays?: number;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  status?: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
