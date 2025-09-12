import { ApiProperty } from '@nestjs/swagger';

export class LegalCaseResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the legal case',
    example: 'uuid-case-id',
  })
  id: string;

  @ApiProperty({
    description: 'Auto-generated case ID',
    example: 'LC-20250721-0001',
  })
  caseId: string;

  @ApiProperty({
    description: 'Loan account number of the borrower',
    example: 'LN4567890',
  })
  loanAccountNumber: string;

  @ApiProperty({
    description: 'Name of the borrower',
    example: 'Mr. Rohit Sharma',
  })
  borrowerName: string;

  @ApiProperty({
    description: 'Type of legal case initiated',
    example: 'Civil',
  })
  caseType: string;

  @ApiProperty({
    description: 'Court where the case is filed',
    example: 'Mumbai Sessions Court',
  })
  courtName: string;

  @ApiProperty({
    description: 'Date of formal case filing',
    example: '2025-07-21',
  })
  caseFiledDate: string;

  @ApiProperty({
    description: 'ID of the lawyer assigned to the case',
    example: 'uuid-lawyer-id',
    required: false,
  })
  lawyerAssignedId?: string;

  @ApiProperty({
    description: 'Name of the assigned lawyer',
    example: 'Mr. Arvind Patil',
    required: false,
  })
  lawyerName?: string;

  @ApiProperty({
    description: 'Court location/state/district',
    example: 'Mumbai, Maharashtra',
  })
  filingJurisdiction: string;

  @ApiProperty({
    description: 'Present legal state of the case',
    example: 'Filed',
  })
  currentStatus: string;

  @ApiProperty({
    description: 'Scheduled date for next hearing',
    example: '2025-08-15',
    required: false,
  })
  nextHearingDate?: string;

  @ApiProperty({
    description: 'Remarks or decisions from last hearing',
    example: 'Case adjourned to next hearing date',
    required: false,
  })
  lastHearingOutcome?: string;

  @ApiProperty({
    description: 'If case resulted in any recovery action',
    example: 'None',
    required: false,
  })
  recoveryActionLinked?: string;

  @ApiProperty({
    description: 'User who created the case',
    example: 'legal-officer-001',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Internal notes for tracking',
    example: 'Initial case filing for loan default',
    required: false,
  })
  caseRemarks?: string;

  @ApiProperty({
    description: 'Date on which case was officially closed',
    example: '2025-12-31',
    required: false,
  })
  caseClosureDate?: string;

  @ApiProperty({
    description: 'Final decision or resolution notes',
    example: 'Case resolved through settlement agreement',
    required: false,
  })
  outcomeSummary?: string;

  @ApiProperty({
    description: 'Date when the case was created',
    example: '2025-07-21T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Date when the case was last updated',
    example: '2025-07-21T15:45:00Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'User who last updated the case',
    example: 'legal-officer-001',
    required: false,
  })
  updatedBy?: string;
}

export class LegalCaseListResponseDto {
  @ApiProperty({
    description: 'List of legal cases',
    type: [LegalCaseResponseDto],
  })
  cases: LegalCaseResponseDto[];

  @ApiProperty({
    description: 'Total number of cases',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of cases per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}
