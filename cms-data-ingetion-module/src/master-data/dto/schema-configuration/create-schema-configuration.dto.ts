import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateSchemaConfigurationDto {
  @IsNotEmpty()
  @IsString()
  schemaName: string;

  @IsNotEmpty()
  @IsString()
  sourceType: string;

  @IsEnum(['active', 'inactive', 'draft'])
  status: 'active' | 'inactive' | 'draft' = 'active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
