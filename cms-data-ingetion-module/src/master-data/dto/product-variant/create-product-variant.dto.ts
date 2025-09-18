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
  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  status: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled';

  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
