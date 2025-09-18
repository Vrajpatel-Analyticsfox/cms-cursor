import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateLanguageDto {
  @IsNotEmpty()
  @IsString()
  languageCode: string;

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
