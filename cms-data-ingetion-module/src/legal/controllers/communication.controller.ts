import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
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
import { CommunicationService } from '../services/communication.service';
import { DeliveryTrackingService } from '../services/delivery-tracking.service';

@ApiTags('Communication Service (UC001)')
@Controller('legal/communication')
@ApiBearerAuth()
export class CommunicationController {
  constructor(
    private readonly communicationService: CommunicationService,
    private readonly deliveryTrackingService: DeliveryTrackingService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send Communication',
    description:
      'Send communication via multiple channels (Email, SMS, WhatsApp, Courier, Post, Physical Delivery)',
  })
  @ApiBody({
    description: 'Communication request details',
    schema: {
      type: 'object',
      properties: {
        recipientId: { type: 'string', example: 'borrower-123' },
        recipientType: {
          type: 'string',
          enum: ['borrower', 'lawyer', 'admin', 'user'],
          example: 'borrower',
        },
        communicationMode: {
          type: 'string',
          enum: ['EMAIL', 'SMS', 'WHATSAPP', 'COURIER', 'POST', 'PHYSICAL_DELIVERY'],
          example: 'EMAIL',
        },
        subject: { type: 'string', example: 'Legal Notice - Account Overdue' },
        content: { type: 'string', example: 'Dear Mr. John Doe, your account is overdue...' },
        templateId: { type: 'string', example: 'template-60dpd-001' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
        scheduledAt: { type: 'string', format: 'date-time', example: '2025-07-22T10:00:00Z' },
        metadata: {
          type: 'object',
          example: { noticeId: 'PLN-20250721-001', caseId: 'LC-20250721-001' },
        },
      },
      required: ['recipientId', 'recipientType', 'communicationMode', 'content', 'priority'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Communication sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: 'EMAIL-1721624400000-ABC123' },
        deliveryStatus: {
          type: 'string',
          enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'],
          example: 'SENT',
        },
        deliveryTimestamp: { type: 'string', format: 'date-time', example: '2025-07-21T10:30:00Z' },
        trackingId: { type: 'string', example: 'EMAIL-1721624400000-ABC123' },
        retryCount: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  async sendCommunication(@Body() request: any) {
    return this.communicationService.sendCommunication(request);
  }

  @Post('send-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send Batch Communications',
    description: 'Send multiple communications in batch',
  })
  @ApiBody({
    description: 'Array of communication requests',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          recipientId: { type: 'string' },
          recipientType: { type: 'string', enum: ['borrower', 'lawyer', 'admin', 'user'] },
          communicationMode: {
            type: 'string',
            enum: ['EMAIL', 'SMS', 'WHATSAPP', 'COURIER', 'POST', 'PHYSICAL_DELIVERY'],
          },
          content: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        },
        required: ['recipientId', 'recipientType', 'communicationMode', 'content', 'priority'],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Batch communications sent successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          messageId: { type: 'string' },
          deliveryStatus: { type: 'string' },
          retryCount: { type: 'number' },
        },
      },
    },
  })
  async sendBatchCommunications(@Body() requests: any[]) {
    return this.communicationService.sendBatchCommunications(requests);
  }

  @Get('track/:messageId')
  @ApiOperation({
    summary: 'Track Delivery by Message ID',
    description: 'Get delivery status and tracking information for a specific message',
  })
  @ApiParam({
    name: 'messageId',
    description: 'Message ID to track',
    example: 'EMAIL-1721624400000-ABC123',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery tracking information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string' },
        trackingId: { type: 'string' },
        status: {
          type: 'string',
          enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'RETURNED'],
        },
        recipientId: { type: 'string' },
        communicationMode: { type: 'string' },
        sentAt: { type: 'string', format: 'date-time' },
        deliveredAt: { type: 'string', format: 'date-time' },
        deliveryAttempts: { type: 'number' },
        errorMessage: { type: 'string' },
        deliveryProof: { type: 'string' },
        geoLocation: { type: 'string' },
        recipientSignature: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async trackDelivery(@Param('messageId') messageId: string) {
    return this.deliveryTrackingService.trackDelivery(messageId);
  }

  @Get('track-by-tracking-id/:trackingId')
  @ApiOperation({
    summary: 'Track Delivery by Tracking ID',
    description: 'Get delivery status using tracking ID',
  })
  @ApiParam({
    name: 'trackingId',
    description: 'Tracking ID to search for',
    example: 'EMAIL-1721624400000-ABC123',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery tracking information retrieved successfully',
  })
  async trackByTrackingId(@Param('trackingId') trackingId: string) {
    return this.deliveryTrackingService.trackByTrackingId(trackingId);
  }

  @Put('update-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Delivery Status',
    description: 'Update delivery status for a specific message',
  })
  @ApiBody({
    description: 'Delivery status update details',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string', example: 'EMAIL-1721624400000-ABC123' },
        trackingId: { type: 'string', example: 'EMAIL-1721624400000-ABC123' },
        status: {
          type: 'string',
          enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'RETURNED'],
          example: 'DELIVERED',
        },
        deliveryProof: { type: 'string', example: '/proofs/delivery-proof-123.pdf' },
        geoLocation: { type: 'string', example: 'Mumbai, Maharashtra, India' },
        recipientSignature: { type: 'string', example: 'John_Doe_Signature.png' },
        errorMessage: { type: 'string', example: 'Invalid email address' },
        metadata: {
          type: 'object',
          example: { deliveryAgent: 'Agent-001', deliveryTime: '2025-07-21T14:30:00Z' },
        },
      },
      required: ['messageId', 'status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async updateDeliveryStatus(@Body() request: any) {
    return this.deliveryTrackingService.updateDeliveryStatus(request);
  }

  @Get('status/:status')
  @ApiOperation({
    summary: 'Get Deliveries by Status',
    description: 'Get all deliveries with a specific status',
  })
  @ApiParam({
    name: 'status',
    description: 'Delivery status to filter by',
    enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'RETURNED'],
    example: 'DELIVERED',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results to return',
    example: 100,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of results to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Deliveries retrieved successfully',
    type: 'array',
  })
  async getDeliveriesByStatus(
    @Param('status') status: string,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
  ) {
    return this.deliveryTrackingService.getDeliveriesByStatus(status, limit, offset);
  }

  @Get('recipient/:recipientId')
  @ApiOperation({
    summary: 'Get Deliveries by Recipient',
    description: 'Get all deliveries for a specific recipient',
  })
  @ApiParam({
    name: 'recipientId',
    description: 'Recipient ID to filter by',
    example: 'borrower-123',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results to return',
    example: 100,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of results to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Deliveries retrieved successfully',
    type: 'array',
  })
  async getDeliveriesByRecipient(
    @Param('recipientId') recipientId: string,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
  ) {
    return this.deliveryTrackingService.getDeliveriesByRecipient(recipientId, limit, offset);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get Communication Statistics',
    description: 'Get comprehensive communication and delivery statistics',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for statistics (YYYY-MM-DD)',
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for statistics (YYYY-MM-DD)',
    example: '2025-07-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalSent: { type: 'number', example: 1500 },
        totalDelivered: { type: 'number', example: 1420 },
        totalFailed: { type: 'number', example: 80 },
        successRate: { type: 'number', example: 94.67 },
        byMode: {
          type: 'object',
          properties: {
            EMAIL: {
              type: 'object',
              properties: {
                sent: { type: 'number' },
                delivered: { type: 'number' },
                failed: { type: 'number' },
                successRate: { type: 'number' },
              },
            },
            SMS: {
              type: 'object',
              properties: {
                sent: { type: 'number' },
                delivered: { type: 'number' },
                failed: { type: 'number' },
                successRate: { type: 'number' },
              },
            },
          },
        },
        byPriority: { type: 'object' },
        averageDeliveryTime: { type: 'number', example: 15.5 },
      },
    },
  })
  async getCommunicationStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.communicationService.getCommunicationStatistics(start, end);
  }

  @Get('delivery-statistics')
  @ApiOperation({
    summary: 'Get Delivery Statistics',
    description: 'Get detailed delivery tracking statistics',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for statistics (YYYY-MM-DD)',
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for statistics (YYYY-MM-DD)',
    example: '2025-07-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery statistics retrieved successfully',
  })
  async getDeliveryStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.deliveryTrackingService.getDeliveryStatistics(start, end);
  }

  @Get('report')
  @ApiOperation({
    summary: 'Generate Delivery Report',
    description: 'Generate comprehensive delivery report with filtering options',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for report (YYYY-MM-DD)',
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for report (YYYY-MM-DD)',
    example: '2025-07-31',
  })
  @ApiQuery({
    name: 'recipientId',
    required: false,
    description: 'Filter by recipient ID',
    example: 'borrower-123',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by delivery status',
    enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'RETURNED'],
    example: 'DELIVERED',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery report generated successfully',
    type: 'array',
  })
  async generateDeliveryReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('recipientId') recipientId?: string,
    @Query('status') status?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.deliveryTrackingService.generateDeliveryReport(start, end, recipientId, status);
  }

  @Post('retry-failed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry Failed Deliveries',
    description: "Retry all failed deliveries that haven't exceeded max retry count",
  })
  @ApiQuery({
    name: 'maxRetries',
    required: false,
    description: 'Maximum number of retries allowed',
    example: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Failed deliveries retried successfully',
    type: 'array',
  })
  async retryFailedDeliveries(@Query('maxRetries') maxRetries: number = 3) {
    return this.deliveryTrackingService.retryFailedDeliveries(maxRetries);
  }

  @Post('retry-failed-communications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry Failed Communications',
    description: "Retry all failed communications that haven't exceeded max retry count",
  })
  @ApiQuery({
    name: 'maxRetries',
    required: false,
    description: 'Maximum number of retries allowed',
    example: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Failed communications retried successfully',
    type: 'array',
  })
  async retryFailedCommunications(@Query('maxRetries') maxRetries: number = 3) {
    return this.communicationService.retryFailedCommunications(maxRetries);
  }
}
