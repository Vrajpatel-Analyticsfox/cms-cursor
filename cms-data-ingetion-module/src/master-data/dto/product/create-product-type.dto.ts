import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateProductTypeDto {
  @IsNotEmpty()
  @IsString()
  typeId: string;

  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @IsNotEmpty()
  @IsString()
  typeName: string;

  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive' = 'active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
