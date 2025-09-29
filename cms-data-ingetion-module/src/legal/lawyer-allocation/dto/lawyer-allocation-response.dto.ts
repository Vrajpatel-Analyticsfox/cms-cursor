import { ApiProperty } from '@nestjs/swagger';

export class LawyerAllocationResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the allocation',
    example: 'uuid-allocation-id',
  })
  id: string;

  @ApiProperty({
    description: 'Unique identifier for each allocation',
    example: 'LAW-20250721-0001',
  })
  allocationId: string;

  @ApiProperty({
    description: 'Legal case to which a lawyer is being assigned',
    example: 'uuid-case-id',
  })
  caseId: string;

  @ApiProperty({
    description: 'Case ID from linked case',
    example: 'LC-20250721-0001',
  })
  caseCode: string;

  @ApiProperty({
    description: 'Loan account number from the linked case',
    example: 'LN4567890',
  })
  loanAccountNumber: string;

  @ApiProperty({
    description: 'Borrower name from the linked case or LMS',
    example: 'Mr. Rohit Sharma',
  })
  borrowerName: string;

  @ApiProperty({
    description: 'Case type from Case Master',
    example: 'Civil',
  })
  caseType: string;

  @ApiProperty({
    description: 'Location/Court where the case will be heard',
    example: 'Mumbai Sessions Court',
  })
  jurisdiction: string;

  @ApiProperty({
    description: 'Type of lawyer',
    example: 'Internal',
  })
  lawyerType: string;

  @ApiProperty({
    description: 'Name of the lawyer being assigned',
    example: 'uuid-lawyer-id',
  })
  lawyerId: string;

  @ApiProperty({
    description: 'Full name of the assigned lawyer',
    example: 'Mr. Arvind Patil',
  })
  lawyerName: string;

  @ApiProperty({
    description: 'Date of assignment',
    example: '2025-07-21',
  })
  allocationDate: string;

  @ApiProperty({
    description: 'If true, indicates reassignment',
    example: false,
  })
  reassignmentFlag: boolean;

  @ApiProperty({
    description: 'Reason for reassignment if applicable',
    example: 'Previous lawyer unavailable',
    required: false,
  })
  reassignmentReason?: string;

  @ApiProperty({
    description: 'Status of the allocation',
    example: 'Active',
  })
  status: string;

  @ApiProperty({
    description: 'Checkbox/flag indicating lawyer has accepted the assignment',
    example: false,
  })
  lawyerAcknowledgement: boolean;

  @ApiProperty({
    description: 'Additional notes or context',
    example: 'High priority case',
    required: false,
  })
  remarks?: string;

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

  @ApiProperty({
    description: 'User who created the allocation',
    example: 'Legal Officer',
  })
  createdBy: string;

  @ApiProperty({
    description: 'User who last updated the allocation',
    example: 'Admin',
    required: false,
  })
  updatedBy?: string;
}

export class LawyerAllocationListResponseDto {
  @ApiProperty({
    description: 'List of lawyer allocations',
    type: [LawyerAllocationResponseDto],
  })
  data: LawyerAllocationResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    example: {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
