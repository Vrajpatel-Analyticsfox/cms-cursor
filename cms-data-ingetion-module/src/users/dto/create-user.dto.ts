import { IsEmail, IsNotEmpty, IsString, IsMobilePhone, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsMobilePhone()
  mobile: string;

  @IsNotEmpty()
  @IsString()
  role: 'TENANT_ADMIN' | 'USER';

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  keycloakId: string;

  @IsNotEmpty()
  tenantId: number;
}
