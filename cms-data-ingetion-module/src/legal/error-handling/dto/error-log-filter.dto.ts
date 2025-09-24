import { IsString, IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorLogFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by source module',
    example: 'PreLegalNotice',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Filter by error type',
    example: 'System',
    enum: ['Validation', 'System', 'Network', 'API', 'Mapping', 'Authorization'],
  })
  @IsOptional()
  @IsEnum(['Validation', 'System', 'Network', 'API', 'Mapping', 'Authorization'])
  errorType?: 'Validation' | 'System' | 'Network' | 'API' | 'Mapping' | 'Authorization';

  @ApiPropertyOptional({
    description: 'Filter by error severity',
    example: 'Error',
    enum: ['Info', 'Warning', 'Error', 'Critical'],
  })
  @IsOptional()
  @IsEnum(['Info', 'Warning', 'Error', 'Critical'])
  severity?: 'Info' | 'Warning' | 'Error' | 'Critical';

  @ApiPropertyOptional({
    description: 'Filter by resolution status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  resolved?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by error code',
    example: 'PLN_001',
  })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity affected',
    example: 'LN4567890',
  })
  @IsOptional()
  @IsString()
  entityAffected?: string;

  @ApiPropertyOptional({
    description: 'Filter by created by user',
    example: 'admin@company.com',
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'Filter by date from (ISO string)',
    example: '2025-01-20T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by date to (ISO string)',
    example: '2025-01-20T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
