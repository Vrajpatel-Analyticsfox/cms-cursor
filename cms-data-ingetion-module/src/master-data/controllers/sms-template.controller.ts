import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SmsTemplateService } from '../services/sms-template.service';
import { SmsApiService } from '../services/sms-api.service';
import {
  SmsTemplate,
  CreateSmsTemplateRequest,
  UpdateSmsTemplateRequest,
  SmsApiResponse,
} from '../dto/sms/sms-api.dto';

@ApiTags('SMS Templates')
@Controller('sms-templates')
export class SmsTemplateController {
  constructor(
    private readonly smsTemplateService: SmsTemplateService,
    private readonly smsApiService: SmsApiService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all SMS templates from external API' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved SMS templates',
    type: [SmsTemplate],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - SMS API error',
  })
  async getAllTemplates(): Promise<SmsTemplate[]> {
    return await this.smsTemplateService.getAllSmsTemplates();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new SMS template' })
  @ApiResponse({
    status: 201,
    description: 'SMS template created successfully',
    type: SmsApiResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid template data or SMS API error',
  })
  async createTemplate(
    @Body() createTemplateRequest: CreateSmsTemplateRequest,
  ): Promise<SmsApiResponse<null>> {
    return await this.smsApiService.createTemplate(createTemplateRequest);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing SMS template' })
  @ApiParam({ name: 'id', description: 'SMS template ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'SMS template updated successfully',
    type: SmsApiResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid template data or SMS API error',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async updateTemplate(
    @Param('id') id: number,
    @Body() updateTemplateRequest: UpdateSmsTemplateRequest,
  ): Promise<SmsApiResponse<null>> {
    return await this.smsApiService.updateTemplate(id, updateTemplateRequest);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an SMS template' })
  @ApiParam({ name: 'id', description: 'SMS template ID', type: 'number' })
  @ApiResponse({
    status: 204,
    description: 'SMS template deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - SMS API error',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async deleteTemplate(@Param('id') id: number): Promise<SmsApiResponse<null>> {
    return await this.smsApiService.deleteTemplate(id);
  }

  @Post('sync/:templateId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync SMS template status from external API' })
  @ApiParam({ name: 'templateId', description: 'Internal template ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'SMS template status synced successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - SMS API error',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async syncTemplateStatus(@Param('templateId') templateId: string): Promise<any> {
    return await this.smsTemplateService.syncSmsTemplateStatus(templateId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Check SMS API configuration status' })
  @ApiResponse({
    status: 200,
    description: 'SMS API configuration status',
    schema: {
      type: 'object',
      properties: {
        configured: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async getApiStatus(): Promise<{ configured: boolean; message: string }> {
    const isConfigured = this.smsApiService.isConfigured();
    return {
      configured: isConfigured,
      message: isConfigured
        ? 'SMS API is properly configured'
        : 'SMS API credentials not configured',
    };
  }
}
