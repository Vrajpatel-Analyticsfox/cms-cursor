import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateProductSubtypeDto {
  @IsNotEmpty()
  @IsString()
  subtypeId: string;

  @IsNotEmpty()
  @IsUUID()
  typeId: string;

  @IsNotEmpty()
  @IsString()
  subtypeName: string;

  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive' = 'active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
