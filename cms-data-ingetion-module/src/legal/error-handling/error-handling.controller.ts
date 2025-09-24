import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ErrorHandlingService } from './error-handling.service';
import { CreateErrorLogDto, ResolveErrorDto, ErrorLogResponseDto, ErrorLogFilterDto } from './dto';

@ApiTags('Error Handling (UC006)')
@Controller('legal/error-handling')
@ApiBearerAuth()
export class ErrorHandlingController {
  constructor(private readonly errorHandlingService: ErrorHandlingService) {}

  @Post('log-error')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log Error',
    description: 'Logs an error with automatic notification and escalation handling',
  })
  @ApiBody({
    type: CreateErrorLogDto,
    description: 'Error log creation request',
    examples: {
      systemError: {
        summary: 'System Error Example',
        value: {
          source: 'PreLegalNotice',
          errorType: 'System',
          errorCode: 'PLN_001',
          errorMessage: 'Failed to create pre-legal notice due to database connection timeout',
          rootCauseSummary: 'Database connection pool exhausted',
          entityAffected: 'LN4567890',
          severity: 'Critical',
          createdBy: 'system',
        },
      },
      validationError: {
        summary: 'Validation Error Example',
        value: {
          source: 'FileUpload',
          errorType: 'Validation',
          errorCode: 'FILE_002',
          errorMessage: 'Invalid file format uploaded',
          entityAffected: 'upload_12345.csv',
          severity: 'Error',
          createdBy: 'admin@company.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Error logged successfully',
    type: ErrorLogResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid error data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async logError(@Body() createErrorLogDto: CreateErrorLogDto): Promise<ErrorLogResponseDto> {
    return await this.errorHandlingService.logError(createErrorLogDto);
  }

  @Get('errors')
  @ApiOperation({
    summary: 'Get Error Logs',
    description: 'Retrieves error logs with filtering and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Error logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ErrorLogResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 10 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async getErrorLogs(
    @Query() filterDto: ErrorLogFilterDto,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: ErrorLogResponseDto[]; pagination: any }> {
    return await this.errorHandlingService.getErrorLogs(filterDto, page, limit);
  }

  @Get('errors/:id')
  @ApiOperation({
    summary: 'Get Error by ID',
    description: 'Retrieves a specific error log by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Error log ID',
    example: 'uuid-123-456-789',
  })
  @ApiResponse({
    status: 200,
    description: 'Error log retrieved successfully',
    type: ErrorLogResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Error log not found',
  })
  async getErrorById(@Param('id') id: string): Promise<ErrorLogResponseDto> {
    return await this.errorHandlingService.getErrorById(id);
  }

  @Post('resolve/:errorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve Error',
    description: 'Marks an error as resolved with resolution notes',
  })
  @ApiParam({
    name: 'errorId',
    description: 'Error ID to resolve',
    example: 'PRELEGALNOTICE_SYSTEM_1a2b3c4d5e6f_xyz123',
  })
  @ApiBody({
    type: ResolveErrorDto,
    description: 'Error resolution request',
    examples: {
      resolution: {
        summary: 'Error Resolution Example',
        value: {
          resolutionNotes: 'Fixed database connection pool configuration and restarted service',
          resolvedBy: 'admin@company.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Error resolved successfully',
    type: ErrorLogResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Error not found',
  })
  async resolveError(
    @Param('errorId') errorId: string,
    @Body() resolveDto: ResolveErrorDto,
  ): Promise<ErrorLogResponseDto> {
    return await this.errorHandlingService.resolveError(errorId, resolveDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get Error Statistics',
    description: 'Retrieves error statistics for monitoring dashboards',
  })
  @ApiResponse({
    status: 200,
    description: 'Error statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        severityStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', example: 'Critical' },
              count: { type: 'number', example: 5 },
            },
          },
        },
        sourceStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', example: 'PreLegalNotice' },
              count: { type: 'number', example: 10 },
            },
          },
        },
        typeStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorType: { type: 'string', example: 'System' },
              count: { type: 'number', example: 8 },
            },
          },
        },
        resolutionStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resolved: { type: 'boolean', example: false },
              count: { type: 'number', example: 15 },
            },
          },
        },
        recentErrors: {
          type: 'array',
          items: { $ref: '#/components/schemas/ErrorLogResponseDto' },
        },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getErrorStatistics(@Query() filterDto?: ErrorLogFilterDto): Promise<any> {
    return await this.errorHandlingService.getErrorStatistics(filterDto);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get Error Dashboard Data',
    description: 'Retrieves comprehensive error dashboard data for monitoring',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalErrors: { type: 'number', example: 150 },
        criticalErrors: { type: 'number', example: 5 },
        unresolvedErrors: { type: 'number', example: 25 },
        errorTrends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hour: { type: 'number', example: 10 },
              errorCount: { type: 'number', example: 3 },
              severity: { type: 'string', example: 'Error' },
            },
          },
        },
        topErrorSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', example: 'PreLegalNotice' },
              count: { type: 'number', example: 45 },
            },
          },
        },
        recentErrors: {
          type: 'array',
          items: { $ref: '#/components/schemas/ErrorLogResponseDto' },
        },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getErrorDashboard(): Promise<any> {
    const statistics = await this.errorHandlingService.getErrorStatistics();

    // Calculate dashboard metrics
    const totalErrors = statistics.severityStats.reduce((sum, stat) => sum + stat.count, 0);
    const criticalErrors =
      statistics.severityStats.find((s) => s.severity === 'Critical')?.count || 0;
    const unresolvedErrors =
      statistics.resolutionStats.find((s) => s.resolved === false)?.count || 0;

    return {
      totalErrors,
      criticalErrors,
      unresolvedErrors,
      errorTrends: statistics.recentErrors.slice(0, 10), // Last 10 errors as trends
      topErrorSources: statistics.sourceStats.slice(0, 5), // Top 5 sources
      recentErrors: statistics.recentErrors,
      lastUpdated: statistics.generatedAt,
    };
  }
}
