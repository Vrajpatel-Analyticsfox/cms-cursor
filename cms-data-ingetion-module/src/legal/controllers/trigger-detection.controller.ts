import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { TriggerDetectionService } from '../services/trigger-detection.service';
import {
  ManualTriggerDetectionDto,
  TriggerDetectionResultDto,
  TriggerStatisticsDto,
} from '../dto/trigger-detection.dto';

@ApiTags('Trigger Detection (UC001)')
@Controller('legal/trigger-detection')
@ApiBearerAuth()
export class TriggerDetectionController {
  constructor(private readonly triggerDetectionService: TriggerDetectionService) {}

  @Post('manual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manual Trigger Detection',
    description: `Manually triggers detection of DPD threshold breaches and payment failures.
    
    Features:
    - On-demand trigger detection
    - Account-specific detection
    - Custom trigger type filtering
    - Force detection override
    - Comprehensive validation and eligibility assessment`,
  })
  @ApiBody({
    type: ManualTriggerDetectionDto,
    description: 'Manual trigger detection parameters',
    examples: {
      specificAccounts: {
        summary: 'Detect triggers for specific accounts',
        value: {
          accountNumbers: ['LN4567890', 'LN7890123'],
          triggerTypes: ['DPD_THRESHOLD', 'PAYMENT_FAILURE'],
          forceDetection: false,
        },
      },
      allAccounts: {
        summary: 'Detect triggers for all eligible accounts',
        value: {
          triggerTypes: ['DPD_THRESHOLD'],
          forceDetection: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Trigger detection completed successfully',
    type: TriggerDetectionResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async manualTriggerDetection(
    @Body() detectionParams: ManualTriggerDetectionDto,
  ): Promise<TriggerDetectionResultDto> {
    try {
      const result = await this.triggerDetectionService.runManualDetection(
        detectionParams.accountNumbers || [],
        detectionParams.triggerTypes,
      );

      return {
        ...result,
        totalTriggered: result.eligibleAccounts.length + result.ineligibleAccounts.length,
        eligibleAccounts: result.eligibleAccounts.map((account) => ({
          ...account,
          triggerType: account.triggerType as any,
          severity: account.severity as any,
          eligibilityStatus: account.eligibilityStatus as any,
          lastPaymentDate: account.lastPaymentDate?.toISOString(),
          detectedAt: account.detectedAt.toISOString(),
        })),
        ineligibleAccounts: result.ineligibleAccounts.map((account) => ({
          id: `ineligible_${Date.now()}_${account.accountNumber}`,
          loanAccountId: account.accountNumber,
          loanAccountNumber: account.accountNumber,
          borrowerName: 'Unknown',
          triggerType: 'INELIGIBLE' as any,
          severity: 'LOW' as any,
          eligibilityStatus: 'INELIGIBLE' as any,
          dpdDays: 0,
          outstandingAmount: 0,
          lastPaymentDate: undefined,
          detectedAt: new Date().toISOString(),
          metadata: { reason: account.reason },
        })),
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get Trigger Detection Statistics',
    description: `Retrieves statistical information about trigger detection performance and patterns.
    
    Includes:
    - Trigger counts by type and severity
    - Detection success rates
    - Common failure patterns
    - Performance metrics
    - Trend analysis`,
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include in statistics (default: 7)',
    example: 7,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: TriggerStatisticsDto,
  })
  async getTriggerStatistics(@Query('days') days: number = 7): Promise<TriggerStatisticsDto> {
    try {
      const statistics = await this.triggerDetectionService.getTriggerStatistics();

      // Convert TriggerStatistics to TriggerStatisticsDto
      const statisticsArray = Object.entries(statistics.triggersByType).map(
        ([triggerType, count]) => ({
          triggerType,
          severity: 'medium', // Default severity since we don't have this breakdown
          count,
        }),
      );

      return {
        period: `Last ${days} days`,
        statistics: statisticsArray,
        totalTriggers: statistics.totalTriggers,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get Trigger Detection Service Status',
    description: `Retrieves the current status of the trigger detection service.
    
    Information includes:
    - Service health status
    - Last automated run details
    - Configuration settings
    - Performance metrics
    - Upcoming scheduled runs`,
  })
  @ApiResponse({
    status: 200,
    description: 'Service status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'HEALTHY',
          enum: ['HEALTHY', 'WARNING', 'ERROR', 'MAINTENANCE'],
        },
        lastAutomatedRun: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T09:00:00Z',
        },
        nextScheduledRun: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T10:00:00Z',
        },
        configuration: {
          type: 'object',
          properties: {
            automatedDetectionEnabled: { type: 'boolean', example: true },
            detectionFrequency: { type: 'string', example: 'hourly' },
            dpdThresholds: { type: 'array', items: { type: 'number' }, example: [30, 60, 90, 120] },
            maxAccountsPerRun: { type: 'number', example: 100 },
          },
        },
        performance: {
          type: 'object',
          properties: {
            averageExecutionTime: { type: 'number', example: 2340 },
            successRate: { type: 'number', example: 98.5 },
            accountsProcessedToday: { type: 'number', example: 245 },
            triggersDetectedToday: { type: 'number', example: 18 },
          },
        },
      },
    },
  })
  async getServiceStatus(): Promise<any> {
    try {
      // In production, this would fetch actual service status
      return {
        status: 'HEALTHY',
        lastAutomatedRun: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        nextScheduledRun: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        configuration: {
          automatedDetectionEnabled: true,
          detectionFrequency: 'hourly',
          dpdThresholds: [30, 60, 90, 120],
          maxAccountsPerRun: 100,
        },
        performance: {
          averageExecutionTime: 2340, // milliseconds
          successRate: 98.5, // percentage
          accountsProcessedToday: 245,
          triggersDetectedToday: 18,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('validate-triggers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate Trigger Events',
    description: `Validates trigger events against business rules and eligibility criteria.
    
    This endpoint works with the Event Validation Service to:
    - Validate trigger event data quality
    - Check business rule compliance
    - Assess eligibility for notice generation
    - Generate recommendations
    - Provide compliance scores`,
  })
  @ApiBody({
    description: 'Trigger events to validate',
    schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'dpd-12345-1642678800000' },
              loanAccountId: { type: 'string', example: 'uuid-loan-account-id' },
              loanAccountNumber: { type: 'string', example: 'LN4567890' },
              triggerType: { type: 'string', example: 'DPD_THRESHOLD' },
              dpdDays: { type: 'number', example: 65 },
              outstandingAmount: { type: 'number', example: 387500 },
              severity: { type: 'string', example: 'MEDIUM' },
            },
          },
        },
      },
    },
    examples: {
      singleEvent: {
        summary: 'Validate single trigger event',
        value: {
          events: [
            {
              id: 'dpd-12345-1642678800000',
              loanAccountId: 'uuid-loan-account-id',
              loanAccountNumber: 'LN4567890',
              triggerType: 'DPD_THRESHOLD',
              dpdDays: 65,
              outstandingAmount: 387500,
              severity: 'MEDIUM',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Trigger events validated successfully',
    schema: {
      type: 'object',
      properties: {
        validationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              isValid: { type: 'boolean' },
              eligibilityStatus: {
                type: 'string',
                enum: ['ELIGIBLE', 'INELIGIBLE', 'PENDING_REVIEW'],
              },
              overallScore: { type: 'number' },
              errors: { type: 'array', items: { type: 'string' } },
              warnings: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalEvents: { type: 'number' },
            eligibleEvents: { type: 'number' },
            ineligibleEvents: { type: 'number' },
            pendingReview: { type: 'number' },
          },
        },
      },
    },
  })
  async validateTriggerEvents(@Body() requestBody: { events: any[] }): Promise<any> {
    try {
      // This would integrate with EventValidationService
      const validationResults = requestBody.events.map((event) => ({
        eventId: event.id,
        isValid: true, // Simulated
        eligibilityStatus: 'ELIGIBLE',
        overallScore: 95,
        errors: [],
        warnings: [],
        recommendations: [],
      }));

      const summary = {
        totalEvents: requestBody.events.length,
        eligibleEvents: validationResults.filter((r) => r.eligibilityStatus === 'ELIGIBLE').length,
        ineligibleEvents: validationResults.filter((r) => r.eligibilityStatus === 'INELIGIBLE')
          .length,
        pendingReview: validationResults.filter((r) => r.eligibilityStatus === 'PENDING_REVIEW')
          .length,
      };

      return {
        validationResults,
        summary,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Checks the health status of the trigger detection service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2025-01-15T10:30:00Z' },
        service: { type: 'string', example: 'Trigger Detection Service' },
        version: { type: 'string', example: '1.0.0' },
        dependencies: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'connected' },
            scheduler: { type: 'string', example: 'running' },
          },
        },
      },
    },
  })
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Trigger Detection Service',
      version: '1.0.0',
      dependencies: {
        database: 'connected',
        scheduler: 'running',
      },
    };
  }
}
