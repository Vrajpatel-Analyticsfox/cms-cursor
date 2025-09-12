import { IsNotEmpty, IsString, IsEmail, IsMobilePhone, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  // Admin user details
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  adminFullName: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  adminEmail: string;

  @IsOptional()
  @IsNotEmpty()
  @IsMobilePhone()
  adminMobile: string;

  @IsOptional()
  @IsString()
  adminAddress?: string;
}
