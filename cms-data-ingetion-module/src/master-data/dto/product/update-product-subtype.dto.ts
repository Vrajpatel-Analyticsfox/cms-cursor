import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';

export class UpdateProductSubtypeDto {
  @IsOptional()
  @IsString()
  subtypeId?: string;

  @IsOptional()
  @IsUUID()
  typeId?: string;

  @IsOptional()
  @IsString()
  subtypeName?: string;

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
