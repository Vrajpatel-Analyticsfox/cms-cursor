import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiPropertyOptional({
    description: 'Unique language identifier (auto-generated if not provided)',
    example: 'LANG_001',
  })
  @IsString()
  @IsOptional()
  languageId?: string;

  @ApiPropertyOptional({
    description: 'Language code (ISO 639-1) - auto-generated if not provided',
    example: 'EN',
  })
  @IsString()
  @IsOptional()
  languageCode?: string;

  @IsNotEmpty()
  @IsString()
  languageName: string;

  @IsNotEmpty()
  @IsString()
  scriptSupport: string;

  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  status: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled' = 'Active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
