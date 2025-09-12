import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateSchemaConfigurationDto {
  @IsOptional()
  @IsString()
  schemaName?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: 'active' | 'inactive' | 'draft';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
