import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateLanguageDto {
  @IsOptional()
  @IsString()
  languageCode?: string;

  @IsOptional()
  @IsString()
  languageName?: string;

  @IsOptional()
  @IsString()
  scriptSupport?: string;

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
