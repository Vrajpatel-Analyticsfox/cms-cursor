import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateSchemaConfigurationDto {
  @IsOptional()
  @IsString()
  schemaName?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

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
