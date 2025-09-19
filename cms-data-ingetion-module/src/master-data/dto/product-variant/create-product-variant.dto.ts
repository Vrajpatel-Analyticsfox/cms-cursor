import { IsString, IsEnum, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @ApiPropertyOptional({
    description: 'Unique variant identifier (auto-generated if not provided)',
    example: 'VARIANT_001',
  })
  @IsString()
  @IsOptional()
  variantId?: string;

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
