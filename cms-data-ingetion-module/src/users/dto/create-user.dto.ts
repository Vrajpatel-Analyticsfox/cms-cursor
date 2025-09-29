import { IsEmail, IsNotEmpty, IsString, IsMobilePhone, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mobile phone number of the user',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsMobilePhone()
  mobile: string;

  @ApiProperty({
    description: 'Role of the user (any text value)',
    example: 'TENANT_ADMIN',
  })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiPropertyOptional({
    description: 'Address of the user',
    example: '123 Main St, City, State',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Keycloak ID for authentication integration',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  keycloakId: string;

  @ApiProperty({
    description: 'Tenant ID this user belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  tenantId: string;
}
