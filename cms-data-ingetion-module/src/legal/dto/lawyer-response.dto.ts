import { ApiProperty } from '@nestjs/swagger';

export class LawyerResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the lawyer',
    example: 'uuid-lawyer-id',
  })
  id: string;

  @ApiProperty({
    description: 'Lawyer code',
    example: 'LAW-20250721-001',
  })
  lawyerCode: string;

  @ApiProperty({
    description: 'First name of the lawyer',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the lawyer',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Full name of the lawyer',
    example: 'John Doe',
  })
  fullName: string;

  @ApiProperty({
    description: 'Email address of the lawyer',
    example: 'john.doe@lawfirm.com',
  })
  email: string;

  @ApiProperty({
    description: 'Phone number of the lawyer',
    example: '+1234567890',
  })
  phone: string;

  @ApiProperty({
    description: 'Bar number of the lawyer',
    example: 'BAR123456',
  })
  barNumber: string;

  @ApiProperty({
    description: 'Specialization of the lawyer',
    example: 'Civil Law',
  })
  specialization: string;

  @ApiProperty({
    description: 'Years of experience',
    example: 5,
  })
  experience: number;

  @ApiProperty({
    description: 'Type of lawyer',
    example: 'Internal',
  })
  lawyerType: string;

  @ApiProperty({
    description: 'Maximum number of concurrent cases',
    example: 10,
  })
  maxCases: number;

  @ApiProperty({
    description: 'Current number of assigned cases',
    example: 3,
  })
  currentCases: number;

  @ApiProperty({
    description: 'Office location',
    example: 'Mumbai, Maharashtra',
  })
  officeLocation: string;

  @ApiProperty({
    description: 'Jurisdiction where the lawyer can practice',
    example: 'Mumbai Sessions Court, Bombay High Court',
  })
  jurisdiction: string;

  @ApiProperty({
    description: 'Success rate percentage',
    example: 85.5,
  })
  successRate: number;

  @ApiProperty({
    description: 'Average case duration in days',
    example: 120,
  })
  averageCaseDuration: number;

  @ApiProperty({
    description: 'Whether the lawyer is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the lawyer is available for new assignments',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Workload percentage',
    example: 30.0,
  })
  workloadPercentage: number;

  @ApiProperty({
    description: 'Workload score for assignment',
    example: 25.5,
  })
  workloadScore: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-07-21T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-07-21T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class LawyerListResponseDto {
  @ApiProperty({
    description: 'List of lawyers',
    type: [LawyerResponseDto],
  })
  lawyers: LawyerResponseDto[];

  @ApiProperty({
    description: 'Total number of lawyers',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}

