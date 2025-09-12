import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';

export class UpdateProductTypeDto {
  @IsOptional()
  @IsString()
  typeId?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsString()
  typeName?: string;

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
