import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateErrorLogDto {
  @ApiProperty({
    description: 'Source module that generated the error',
    example: 'PreLegalNotice',
    enum: ['PreLegalNotice', 'FileUpload', 'Scheduler', 'TemplateEngine', 'DataIngestion'],
  })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({
    description: 'Type of error that occurred',
    example: 'System',
    enum: ['Validation', 'System', 'Network', 'API', 'Mapping', 'Authorization'],
  })
  @IsEnum(['Validation', 'System', 'Network', 'API', 'Mapping', 'Authorization'])
  errorType: 'Validation' | 'System' | 'Network' | 'API' | 'Mapping' | 'Authorization';

  @ApiProperty({
    description: 'Module-specific error code',
    example: 'PLN_001',
  })
  @IsString()
  @IsNotEmpty()
  errorCode: string;

  @ApiProperty({
    description: 'User-readable error message',
    example: 'Failed to create pre-legal notice due to validation error',
  })
  @IsString()
  @IsNotEmpty()
  errorMessage: string;

  @ApiPropertyOptional({
    description: 'System-diagnosed root cause of the error',
    example: 'Database connection timeout during template validation',
  })
  @IsOptional()
  @IsString()
  rootCauseSummary?: string;

  @ApiPropertyOptional({
    description: 'Stack trace for debugging (system/API errors only)',
    example: 'Error: Connection timeout\n    at DatabaseService.query...',
  })
  @IsOptional()
  @IsString()
  stackTrace?: string;

  @ApiPropertyOptional({
    description: 'Entity identifier affected by the error',
    example: 'LN4567890',
  })
  @IsOptional()
  @IsString()
  entityAffected?: string;

  @ApiPropertyOptional({
    description: 'Error severity level',
    example: 'Error',
    enum: ['Info', 'Warning', 'Error', 'Critical'],
    default: 'Info',
  })
  @IsOptional()
  @IsEnum(['Info', 'Warning', 'Error', 'Critical'])
  severity?: 'Info' | 'Warning' | 'Error' | 'Critical';

  @ApiPropertyOptional({
    description: 'User or system that created the error log',
    example: 'system',
    default: 'system',
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the error',
    example: { loanAccountNumber: 'LN4567890', templateId: 'template-123' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
