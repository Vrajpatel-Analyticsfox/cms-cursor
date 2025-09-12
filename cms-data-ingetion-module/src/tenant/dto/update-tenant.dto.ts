import { IsOptional, IsString, IsEmail, IsMobilePhone } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  // Admin user details (optional for update)
  @IsOptional()
  @IsString()
  adminFullName?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsMobilePhone()
  adminMobile?: string;

  @IsOptional()
  @IsString()
  adminAddress?: string;
}
