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

  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  status: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled' = 'Active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
