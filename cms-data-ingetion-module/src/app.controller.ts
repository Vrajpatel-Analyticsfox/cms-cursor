import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Core')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Root endpoint',
    description: 'Returns a welcome message for the CMS Data Ingestion Module',
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome message returned successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Welcome to CMS Data Ingestion Module API',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-21T10:30:00.000Z',
        },
        version: {
          type: 'string',
          example: '1.0.0',
        },
      },
    },
  })
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the current health status of the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Application health status',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'healthy',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-21T10:30:00.000Z',
        },
        uptime: {
          type: 'number',
          example: 123.45,
        },
        environment: {
          type: 'string',
          example: 'development',
        },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('info')
  @ApiOperation({
    summary: 'Application information',
    description: 'Returns detailed information about the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Application information returned successfully',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'CMS Data Ingestion Module',
        },
        version: {
          type: 'string',
          example: '1.0.0',
        },
        description: {
          type: 'string',
          example: 'Comprehensive API for CMS Data Ingestion Module with Master Data Management',
        },
        environment: {
          type: 'string',
          example: 'development',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-21T10:30:00.000Z',
        },
      },
    },
  })
  getInfo() {
    return this.appService.getInfo();
  }
}
