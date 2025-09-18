import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateSchemaConfigurationDto {
  @IsNotEmpty()
  @IsString()
  schemaName: string;

  @IsNotEmpty()
  @IsString()
  sourceType: string;

  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  status: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled' = 'Active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
