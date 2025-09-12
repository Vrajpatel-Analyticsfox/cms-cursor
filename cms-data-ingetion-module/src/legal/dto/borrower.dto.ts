import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsIn, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class BorrowerSearchDto {
  @ApiProperty({
    description: 'Search term for borrower name or loan account number',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiProperty({
    description: 'Filter by borrower name (partial match)',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  borrowerName?: string;

  @ApiProperty({
    description: 'Filter by loan account number (partial match)',
    example: 'LN123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  loanAccountNumber?: string;

  @ApiProperty({
    description: 'Filter by mobile number (partial match)',
    example: '98765',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  mobileNumber?: string;

  @ApiProperty({
    description: 'Filter by email address (partial match)',
    example: 'john@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiProperty({
    description: 'Filter by product type',
    example: 'Personal Loan',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productType?: string;

  @ApiProperty({
    description: 'Filter by branch code',
    example: 'BR001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  branchCode?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Field to sort by',
    example: 'borrowerName',
    required: false,
    enum: ['borrowerName', 'loanAccountNumber', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['borrowerName', 'loanAccountNumber', 'createdAt'])
  sortBy?: string = 'borrowerName';

  @ApiProperty({
    description: 'Sort order',
    example: 'asc',
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class BorrowerDto {
  @ApiProperty({
    description: 'Unique loan account number',
    example: 'LN1234567',
  })
  loanAccountNumber: string;

  @ApiProperty({
    description: 'Full name of the borrower',
    example: 'John Doe',
  })
  borrowerName: string;

  @ApiProperty({
    description: 'Mobile number of the borrower',
    example: '9876543210',
    required: false,
  })
  borrowerMobile?: string;

  @ApiProperty({
    description: 'Email address of the borrower',
    example: 'john.doe@example.com',
    required: false,
  })
  borrowerEmail?: string;

  @ApiProperty({
    description: 'Address of the borrower',
    example: '123 Main Street, City, State',
    required: false,
  })
  borrowerAddress?: string;

  @ApiProperty({
    description: 'Loan amount',
    example: '500000',
    required: false,
  })
  loanAmount?: string;

  @ApiProperty({
    description: 'Outstanding amount',
    example: '250000',
    required: false,
  })
  outstandingAmount?: string;

  @ApiProperty({
    description: 'Current DPD (Days Past Due)',
    example: 30,
    required: false,
  })
  currentDpd?: number;

  @ApiProperty({
    description: 'Product type',
    example: 'Personal Loan',
    required: false,
  })
  productType?: string;

  @ApiProperty({
    description: 'Branch code',
    example: 'BR001',
    required: false,
  })
  branchCode?: string;

  @ApiProperty({
    description: 'Date when the record was created',
    example: '2025-01-21T10:30:00Z',
  })
  createdAt: string;
}

export class BorrowerListResponseDto {
  @ApiProperty({
    description: 'Array of borrower records',
    type: [BorrowerDto],
  })
  borrowers: BorrowerDto[];

  @ApiProperty({
    description: 'Total number of borrowers matching the criteria',
    example: 150,
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
    example: 15,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPreviousPage: boolean;
}

