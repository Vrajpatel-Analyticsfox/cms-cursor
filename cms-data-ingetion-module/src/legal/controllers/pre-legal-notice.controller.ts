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
import { PreLegalNoticeService } from '../services/pre-legal-notice.service';
import {
  CreatePreLegalNoticeDto,
  UpdateNoticeStatusDto,
  PreLegalNoticeResponseDto,
  PreLegalNoticeListResponseDto,
  GenerateNoticePreviewDto,
  NoticePreviewResponseDto,
  NoticeFilterDto,
  NoticeStatus,
  TriggerType,
} from '../dto/pre-legal-notice.dto';

@ApiTags('Pre-Legal Notices (UC001)')
@Controller('legal/pre-legal-notices')
@ApiBearerAuth()
export class PreLegalNoticeController {
  constructor(private readonly preLegalNoticeService: PreLegalNoticeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Pre-Legal Notice (UC001)',
    description: `Creates a new pre-legal notice following UC001 specifications:
    - Generates unique Notice ID with format PLN-YYYYMMDD-[Sequence]
    - Validates loan account existence in LMS
    - Checks for duplicate notices within 7 days for same DPD and account
    - Supports multiple communication modes
    - Auto-calculates expiry date
    - Maintains audit trail`,
  })
  @ApiBody({
    type: CreatePreLegalNoticeDto,
    description: 'Pre-legal notice creation details',
    examples: {
      example1: {
        summary: 'Standard 60-day DPD notice',
        value: {
          loanAccountNumber: 'LN4567890',
          dpdDays: 62,
          triggerType: 'DPD Threshold',
          templateId: 'uuid-template-id',
          communicationMode: ['Email', 'SMS'],
          noticeExpiryDate: '2025-07-28',
          legalEntityName: 'CollectPro Recovery Services',
          issuedBy: 1,
          acknowledgementRequired: true,
          remarks: 'Standard 60-day DPD notice',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Pre-legal notice created successfully',
    type: PreLegalNoticeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors or business rule violations',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Duplicate notice generation for same DPD (62) and account within 7 days is restricted',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Loan account or template not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Loan account LN4567890 not found in LMS',
        error: 'Not Found',
      },
    },
  })
  async createPreLegalNotice(
    @Body() createDto: CreatePreLegalNoticeDto,
    @Request() req: any,
  ): Promise<PreLegalNoticeResponseDto> {
    const createdBy = req.user?.username || 'system';
    return this.preLegalNoticeService.createPreLegalNotice(createDto, createdBy);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Notice Preview',
    description: `Generates a preview of the notice without saving it to the database.
    This allows users to review the final notice content before creation.`,
  })
  @ApiBody({
    type: GenerateNoticePreviewDto,
    description: 'Preview generation parameters',
    examples: {
      example1: {
        summary: 'Preview 60-day notice',
        value: {
          templateId: 'uuid-template-id',
          loanAccountNumber: 'LN4567890',
          dpdDays: 62,
          legalEntityName: 'CollectPro Recovery Services',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notice preview generated successfully',
    type: NoticePreviewResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Loan account or template not found',
  })
  async generatePreview(
    @Body() previewDto: GenerateNoticePreviewDto,
  ): Promise<NoticePreviewResponseDto> {
    return this.preLegalNoticeService.generateNoticePreview(previewDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get Pre-Legal Notices with Filters',
    description: `Retrieves a paginated list of pre-legal notices with optional filtering by:
    - Loan account number
    - Notice status
    - Trigger type  
    - Date range
    Supports pagination and sorting by creation date (newest first).`,
  })
  @ApiQuery({
    name: 'loanAccountNumber',
    required: false,
    description: 'Filter by loan account number',
    example: 'LN4567890',
  })
  @ApiQuery({
    name: 'noticeStatus',
    required: false,
    enum: NoticeStatus,
    description: 'Filter by notice status',
    example: NoticeStatus.SENT,
  })
  @ApiQuery({
    name: 'triggerType',
    required: false,
    enum: TriggerType,
    description: 'Filter by trigger type',
    example: TriggerType.DPD_THRESHOLD,
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Filter from date (YYYY-MM-DD)',
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Filter to date (YYYY-MM-DD)',
    example: '2025-07-31',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Pre-legal notices retrieved successfully',
    type: PreLegalNoticeListResponseDto,
  })
  async getPreLegalNotices(
    @Query() filters: NoticeFilterDto,
  ): Promise<PreLegalNoticeListResponseDto> {
    return this.preLegalNoticeService.getNotices(filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Pre-Legal Notice by ID',
    description: 'Retrieves a specific pre-legal notice by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notice UUID',
    example: 'uuid-notice-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Pre-legal notice retrieved successfully',
    type: PreLegalNoticeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notice not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Notice uuid-notice-id not found',
        error: 'Not Found',
      },
    },
  })
  async getPreLegalNoticeById(@Param('id') id: string): Promise<PreLegalNoticeResponseDto> {
    return this.preLegalNoticeService.getNoticeById(id);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Notice Status',
    description: `Updates the status of a pre-legal notice through its lifecycle:
    Draft → Generated → Sent → (Acknowledged/Failed)
    
    Also allows updating the document path when PDF is generated and remarks.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Notice UUID',
    example: 'uuid-notice-id',
  })
  @ApiBody({
    type: UpdateNoticeStatusDto,
    description: 'Status update details',
    examples: {
      markAsSent: {
        summary: 'Mark notice as sent',
        value: {
          noticeStatus: 'Sent',
          documentPath: '/documents/notices/PLN-20250721-001.pdf',
          remarks: 'Notice sent via email and SMS successfully',
        },
      },
      markAsAcknowledged: {
        summary: 'Mark notice as acknowledged',
        value: {
          noticeStatus: 'Acknowledged',
          remarks: 'Borrower acknowledged receipt via email on 2025-07-22',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notice status updated successfully',
    type: PreLegalNoticeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notice not found',
  })
  async updateNoticeStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateNoticeStatusDto,
    @Request() req: any,
  ): Promise<PreLegalNoticeResponseDto> {
    const updatedBy = req.user?.username || 'system';
    return this.preLegalNoticeService.updateNoticeStatus(id, updateDto, updatedBy);
  }

  @Get('account/:accountNumber')
  @ApiOperation({
    summary: 'Get Notices by Loan Account',
    description: 'Retrieves all pre-legal notices for a specific loan account number.',
  })
  @ApiParam({
    name: 'accountNumber',
    description: 'Loan account number',
    example: 'LN4567890',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Account notices retrieved successfully',
    type: PreLegalNoticeListResponseDto,
  })
  async getNoticesByAccount(
    @Param('accountNumber') accountNumber: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PreLegalNoticeListResponseDto> {
    const filters: NoticeFilterDto = {
      loanAccountNumber: accountNumber,
      page,
      limit,
    };
    return this.preLegalNoticeService.getNotices(filters);
  }

  @Get('templates/active')
  @ApiOperation({
    summary: 'Get Active Notice Templates',
    description: 'Retrieves all active pre-legal notice templates for selection.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active templates retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-template-id' },
          templateCode: { type: 'string', example: 'PLN-60DPD-STD' },
          templateName: { type: 'string', example: 'Template-60DPD-Standard' },
          templateType: { type: 'string', example: 'Pre-Legal' },
          maxCharacters: { type: 'number', example: 500 },
          description: { type: 'string', example: 'Standard template for 60+ DPD accounts' },
        },
      },
    },
  })
  async getActiveTemplates() {
    // This would be implemented in a separate template service
    // For now, returning a placeholder response structure
    return {
      message: 'Active templates endpoint - to be implemented with template service',
      note: 'This endpoint would return all active pre-legal notice templates',
    };
  }
}
