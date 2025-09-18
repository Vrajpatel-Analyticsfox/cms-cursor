import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { CreateTemplateDto, UpdateTemplateDto, TemplateType, TemplateStatus } from './dto/template';

@ApiTags('Master Data - Template')
@Controller('master-data/template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new template',
    description: 'Creates a new message template with channel and language configuration',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        templateId: {
          type: 'string',
          example: 'TEMP001',
        },
        channelId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        languageId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        templateName: {
          type: 'string',
          example: 'Payment Reminder',
        },
        messageBody: {
          type: 'string',
          example: 'Hello {{customer_name}}, your payment is due.',
        },
        templateType: {
          type: 'string',
          enum: Object.values(TemplateType),
          example: TemplateType.PRE_LEGAL,
        },
        status: {
          type: 'string',
          enum: Object.values(TemplateStatus),
          example: TemplateStatus.ACTIVE,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-21T10:30:00.000Z',
        },
        createdBy: {
          type: 'string',
          example: 'admin',
        },
      },
    },
  })
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templateService.create(createTemplateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all templates',
    description: 'Retrieves a list of all message templates',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          templateId: { type: 'string' },
          channelId: { type: 'string', format: 'uuid' },
          languageId: { type: 'string', format: 'uuid' },
          templateName: { type: 'string' },
          messageBody: { type: 'string' },
          templateType: { type: 'string', enum: Object.values(TemplateType) },
          status: { type: 'string', enum: Object.values(TemplateStatus) },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findAll() {
    return this.templateService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active templates',
    description: 'Retrieves a list of all active templates',
  })
  @ApiResponse({
    status: 200,
    description: 'Active templates retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          templateId: { type: 'string' },
          channelId: { type: 'string', format: 'uuid' },
          languageId: { type: 'string', format: 'uuid' },
          templateName: { type: 'string' },
          messageBody: { type: 'string' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.templateService.findActive();
  }

  @Get('by-channel')
  @ApiOperation({
    summary: 'Get templates by channel',
    description: 'Retrieves templates filtered by channel ID',
  })
  @ApiQuery({
    name: 'channelId',
    description: 'Channel UUID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates by channel retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          templateId: { type: 'string' },
          channelId: { type: 'string', format: 'uuid' },
          languageId: { type: 'string', format: 'uuid' },
          templateName: { type: 'string' },
          messageBody: { type: 'string' },
          templateType: { type: 'string', enum: Object.values(TemplateType) },
          status: { type: 'string', enum: Object.values(TemplateStatus) },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findByChannel(@Query('channelId') channelId: string) {
    return this.templateService.findByChannel(channelId);
  }

  @Get('by-language')
  async findByLanguage(@Query('languageId') languageId: string) {
    return this.templateService.findByLanguage(languageId);
  }

  @Get('active/by-channel')
  async findActiveByChannel(@Query('channelId') channelId: string) {
    return this.templateService.findActiveByChannel(channelId);
  }

  @Get('active/by-language')
  async findActiveByLanguage(@Query('languageId') languageId: string) {
    return this.templateService.findActiveByLanguage(languageId);
  }

  @Get('by-template-type')
  @ApiOperation({
    summary: 'Get templates by template type',
    description:
      'Retrieves templates filtered by template type (Pre-Legal, Legal, Final Warning, etc.)',
  })
  @ApiQuery({
    name: 'templateType',
    description: 'Template type to filter by',
    enum: TemplateType,
    example: TemplateType.PRE_LEGAL,
  })
  @ApiResponse({
    status: 200,
    description: 'Templates by type retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          templateId: { type: 'string' },
          channelId: { type: 'string', format: 'uuid' },
          languageId: { type: 'string', format: 'uuid' },
          templateName: { type: 'string' },
          messageBody: { type: 'string' },
          templateType: { type: 'string', enum: Object.values(TemplateType) },
          status: { type: 'string', enum: Object.values(TemplateStatus) },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findByTemplateType(@Query('templateType') templateType: TemplateType) {
    return this.templateService.findByTemplateType(templateType);
  }

  @Get('active/by-template-type')
  @ApiOperation({
    summary: 'Get active templates by template type',
    description: 'Retrieves active templates filtered by template type',
  })
  @ApiQuery({
    name: 'templateType',
    description: 'Template type to filter by',
    enum: TemplateType,
    example: TemplateType.PRE_LEGAL,
  })
  @ApiResponse({
    status: 200,
    description: 'Active templates by type retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          templateId: { type: 'string' },
          channelId: { type: 'string', format: 'uuid' },
          languageId: { type: 'string', format: 'uuid' },
          templateName: { type: 'string' },
          messageBody: { type: 'string' },
          templateType: { type: 'string', enum: Object.values(TemplateType) },
          status: { type: 'string', enum: [TemplateStatus.ACTIVE] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActiveByTemplateType(@Query('templateType') templateType: TemplateType) {
    return this.templateService.findActiveByTemplateType(templateType);
  }

  @Get('by-channel-and-template-type')
  @ApiOperation({
    summary: 'Get templates by channel and template type',
    description: 'Retrieves templates filtered by both channel and template type',
  })
  @ApiQuery({
    name: 'channelId',
    description: 'Channel UUID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'templateType',
    description: 'Template type to filter by',
    enum: TemplateType,
    example: TemplateType.PRE_LEGAL,
  })
  @ApiResponse({
    status: 200,
    description: 'Templates by channel and type retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          templateId: { type: 'string' },
          channelId: { type: 'string', format: 'uuid' },
          languageId: { type: 'string', format: 'uuid' },
          templateName: { type: 'string' },
          messageBody: { type: 'string' },
          templateType: { type: 'string', enum: Object.values(TemplateType) },
          status: { type: 'string', enum: Object.values(TemplateStatus) },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findByChannelAndTemplateType(
    @Query('channelId') channelId: string,
    @Query('templateType') templateType: TemplateType,
  ) {
    return this.templateService.findByChannelAndTemplateType(channelId, templateType);
  }

  @Get('active/by-channel-and-template-type')
  @ApiOperation({
    summary: 'Get active templates by channel and template type',
    description: 'Retrieves active templates filtered by both channel and template type',
  })
  @ApiQuery({
    name: 'channelId',
    description: 'Channel UUID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'templateType',
    description: 'Template type to filter by',
    enum: TemplateType,
    example: TemplateType.PRE_LEGAL,
  })
  @ApiResponse({
    status: 200,
    description: 'Active templates by channel and type retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          templateId: { type: 'string' },
          channelId: { type: 'string', format: 'uuid' },
          languageId: { type: 'string', format: 'uuid' },
          templateName: { type: 'string' },
          messageBody: { type: 'string' },
          templateType: { type: 'string', enum: Object.values(TemplateType) },
          status: { type: 'string', enum: [TemplateStatus.ACTIVE] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActiveByChannelAndTemplateType(
    @Query('channelId') channelId: string,
    @Query('templateType') templateType: TemplateType,
  ) {
    return this.templateService.findActiveByChannelAndTemplateType(channelId, templateType);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get template by ID',
    description: 'Retrieves a specific template by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Template UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        templateId: { type: 'string' },
        channelId: { type: 'string', format: 'uuid' },
        languageId: { type: 'string', format: 'uuid' },
        templateName: { type: 'string' },
        messageBody: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Template not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update template',
    description: 'Updates an existing template with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Template UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        templateId: { type: 'string' },
        channelId: { type: 'string', format: 'uuid' },
        languageId: { type: 'string', format: 'uuid' },
        templateName: { type: 'string' },
        messageBody: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Template not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    return this.templateService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete template',
    description: 'Soft deletes a template by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'Template UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Template deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Template deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Template not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.templateService.remove(id);
  }
}
