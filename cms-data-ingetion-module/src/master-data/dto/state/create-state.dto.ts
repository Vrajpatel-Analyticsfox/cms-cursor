import { IsString, IsNotEmpty, IsEnum, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStateDto {
  @ApiProperty({
    description: 'Unique state code (2-3 characters)',
    example: 'MH',
    minLength: 2,
    maxLength: 3,
    pattern: '^[A-Z]{2,3}$',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 3)
  @Matches(/^[A-Z]{2,3}$/, { message: 'State code must be 2-3 uppercase letters' })
  stateCode: string;

  @ApiProperty({
    description: 'Full state name',
    example: 'Maharashtra',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  stateName: string;

  @ApiProperty({
    description: 'Unique state identifier',
    example: 'STATE_001',
    minLength: 3,
    maxLength: 50,
    pattern: '^[A-Z0-9_]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'State ID must contain only uppercase letters, numbers, and underscores',
  })
  stateId: string;

  @ApiProperty({
    description: 'State status',
    enum: ['active', 'inactive'],
    example: 'active',
    default: 'active',
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiProperty({
    description: 'User who created the state',
    example: 'admin',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  createdBy: string;
}
