import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductTypeDto {
  @ApiPropertyOptional({
    description: 'Unique type identifier (auto-generated if not provided)',
    example: 'TYPE_001',
  })
  @IsString()
  @IsOptional()
  typeId?: string;

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
