import { ApiProperty } from '@nestjs/swagger';

export class ErrorLogResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the error log',
    example: 'uuid-123-456-789',
  })
  id: string;

  @ApiProperty({
    description: 'Auto-generated unique error identifier',
    example: 'PRELEGALNOTICE_SYSTEM_1a2b3c4d5e6f_xyz123',
  })
  errorId: string;

  @ApiProperty({
    description: 'Source module that generated the error',
    example: 'PreLegalNotice',
  })
  source: string;

  @ApiProperty({
    description: 'Type of error that occurred',
    example: 'System',
  })
  errorType: string;

  @ApiProperty({
    description: 'Module-specific error code',
    example: 'PLN_001',
  })
  errorCode: string;

  @ApiProperty({
    description: 'User-readable error message',
    example: 'Failed to create pre-legal notice due to validation error',
  })
  errorMessage: string;

  @ApiProperty({
    description: 'System-diagnosed root cause of the error',
    example: 'Database connection timeout during template validation',
    required: false,
  })
  rootCauseSummary?: string;

  @ApiProperty({
    description: 'Stack trace for debugging',
    example: 'Error: Connection timeout\n    at DatabaseService.query...',
    required: false,
  })
  stackTrace?: string;

  @ApiProperty({
    description: 'Entity identifier affected by the error',
    example: 'LN4567890',
    required: false,
  })
  entityAffected?: string;

  @ApiProperty({
    description: 'Error severity level',
    example: 'Error',
  })
  severity: string;

  @ApiProperty({
    description: 'Whether the error can be retried automatically',
    example: true,
  })
  retriable: boolean;

  @ApiProperty({
    description: 'Whether the error has been resolved',
    example: false,
  })
  resolved: boolean;

  @ApiProperty({
    description: 'Resolution notes explaining how the error was resolved',
    example: 'Fixed database connection pool configuration',
    required: false,
  })
  resolutionNotes?: string;

  @ApiProperty({
    description: 'User who resolved the error',
    example: 'admin@company.com',
    required: false,
  })
  resolvedBy?: string;

  @ApiProperty({
    description: 'When the error occurred',
    example: '2025-01-20T10:30:00Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'User or system that created the error log',
    example: 'system',
  })
  createdBy: string;

  @ApiProperty({
    description: 'When the error log was created',
    example: '2025-01-20T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the error log was last updated',
    example: '2025-01-20T10:35:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'When the error was resolved',
    example: '2025-01-20T10:35:00Z',
    required: false,
  })
  resolvedAt?: Date;
}
