import { IsOptional, IsString, IsEmail, IsMobilePhone } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Mobile phone number of the user',
    example: '+1234567890',
  })
  @IsOptional()
  @IsMobilePhone()
  mobile?: string;

  @ApiPropertyOptional({
    description: 'Role of the user (any text value)',
    example: 'TENANT_ADMIN',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Address of the user',
    example: '123 Main St, City, State',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Keycloak ID for authentication integration',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  keycloakId?: string;

  @ApiPropertyOptional({
    description: 'Tenant ID this user belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
