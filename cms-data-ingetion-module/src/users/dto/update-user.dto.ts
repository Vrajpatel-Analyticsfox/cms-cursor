import { IsOptional, IsString, IsEmail, IsMobilePhone } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsMobilePhone()
  mobile?: string;

  @IsOptional()
  @IsString()
  role?: 'TENANT_ADMIN' | 'USER';

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  keycloakId?: string;

  @IsOptional()
  tenantId?: number;
}
