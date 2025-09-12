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

  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive' = 'active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
