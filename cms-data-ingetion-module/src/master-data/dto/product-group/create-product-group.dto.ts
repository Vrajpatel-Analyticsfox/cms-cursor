import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductGroupDto {
  @ApiPropertyOptional({
    description: 'Unique group identifier (auto-generated if not provided)',
    example: 'GROUP_001',
  })
  @IsString()
  @IsOptional()
  groupId?: string;

  @IsNotEmpty()
  @IsString()
  groupName: string;

  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  status: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled' = 'Active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
