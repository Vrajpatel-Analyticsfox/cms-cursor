import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateProductGroupDto {
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @IsNotEmpty()
  @IsString()
  groupName: string;

  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive' = 'active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
