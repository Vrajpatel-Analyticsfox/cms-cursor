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
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
