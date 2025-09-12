import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { CreateStateDto } from './create-state.dto';

export class UpdateStateDto extends PartialType(CreateStateDto) {
  @ApiPropertyOptional({
    description: 'Full state name',
    example: 'Maharashtra Updated',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  stateName?: string;

  @ApiPropertyOptional({
    description: 'State status',
    enum: ['active', 'inactive'],
    example: 'inactive',
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'User who updated the state',
    example: 'admin',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  updatedBy?: string;
}
