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
  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  status?: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
