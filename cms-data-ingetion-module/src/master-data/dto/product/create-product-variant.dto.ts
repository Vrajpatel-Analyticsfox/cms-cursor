import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateProductVariantDto {
  @IsNotEmpty()
  @IsString()
  variantId: string;

  @IsNotEmpty()
  @IsUUID()
  subtypeId: string;

  @IsNotEmpty()
  @IsString()
  variantName: string;

  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive' = 'active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
