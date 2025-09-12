import { IsString, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';

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

  @IsNotEmpty()
  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive';

  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
