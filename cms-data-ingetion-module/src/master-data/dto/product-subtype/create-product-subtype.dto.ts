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

  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  status: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled' = 'Active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
