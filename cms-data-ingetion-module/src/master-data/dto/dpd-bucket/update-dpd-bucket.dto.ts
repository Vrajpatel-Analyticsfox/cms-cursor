import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';

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
  @IsString()
  module?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
