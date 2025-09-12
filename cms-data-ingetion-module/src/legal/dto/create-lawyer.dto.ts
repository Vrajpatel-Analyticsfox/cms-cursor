import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsInt,
  IsBoolean,
  IsOptional,
  IsEnum,
  MaxLength,
  Min,
  IsPhoneNumber,
} from 'class-validator';

export class CreateLawyerDto {
  @ApiProperty({
    description: 'First name of the lawyer',
    example: 'John',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'Last name of the lawyer',
    example: 'Doe',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'Email address of the lawyer',
    example: 'john.doe@lawfirm.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number of the lawyer',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Bar number of the lawyer',
    example: 'BAR123456',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  barNumber: string;

  @ApiProperty({
    description: 'Specialization of the lawyer',
    example: 'Civil Law',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  specialization: string;

  @ApiProperty({
    description: 'Years of experience',
    example: 5,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  experience: number;

  @ApiProperty({
    description: 'Type of lawyer',
    enum: ['Internal', 'External', 'Senior', 'Junior', 'Associate'],
    example: 'Internal',
  })
  @IsEnum(['Internal', 'External', 'Senior', 'Junior', 'Associate'])
  @IsNotEmpty()
  lawyerType: 'Internal' | 'External' | 'Senior' | 'Junior' | 'Associate';

  @ApiProperty({
    description: 'Maximum number of concurrent cases',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxCases?: number = 10;

  @ApiProperty({
    description: 'Office location',
    example: 'Mumbai, Maharashtra',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  officeLocation: string;

  @ApiProperty({
    description: 'Jurisdiction where the lawyer can practice',
    example: 'Mumbai Sessions Court, Bombay High Court',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  jurisdiction: string;

  @ApiProperty({
    description: 'Whether the lawyer is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Whether the lawyer is available for new assignments',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean = true;
}

