import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsUUID()
  subtypeId?: string;

  @IsOptional()
  @IsString()
  variantName?: string;

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
