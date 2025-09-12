import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateProductGroupDto {
  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  groupName?: string;

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
