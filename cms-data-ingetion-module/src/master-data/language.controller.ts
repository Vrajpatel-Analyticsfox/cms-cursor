import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LanguageService } from './language.service';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language';

@ApiTags('Master Data - Language')
@Controller('master-data/language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new language',
    description: 'Creates a new language configuration with script support',
  })
  @ApiResponse({
    status: 201,
    description: 'Language created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        languageCode: {
          type: 'string',
          example: 'EN',
        },
        languageName: {
          type: 'string',
          example: 'English',
        },
        scriptSupport: {
          type: 'string',
          example: 'Latin',
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive'],
          example: 'active',
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
  async create(@Body() createLanguageDto: CreateLanguageDto) {
    return this.languageService.create(createLanguageDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all languages',
    description: 'Retrieves a list of all configured languages',
  })
  @ApiResponse({
    status: 200,
    description: 'Languages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          languageCode: { type: 'string' },
          languageName: { type: 'string' },
          scriptSupport: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findAll() {
    return this.languageService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active languages',
    description: 'Retrieves a list of all active languages',
  })
  @ApiResponse({
    status: 200,
    description: 'Active languages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          languageCode: { type: 'string' },
          languageName: { type: 'string' },
          scriptSupport: { type: 'string' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.languageService.findActive();
  }

  @Get('by-script')
  @ApiOperation({
    summary: 'Get languages by script',
    description: 'Retrieves languages filtered by script type',
  })
  @ApiQuery({
    name: 'script',
    description: 'Script type to filter by',
    example: 'Latin',
  })
  @ApiResponse({
    status: 200,
    description: 'Languages by script retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          languageCode: { type: 'string' },
          languageName: { type: 'string' },
          scriptSupport: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findByScript(@Query('script') script: string) {
    return this.languageService.findByScript(script);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get language by ID',
    description: 'Retrieves a specific language by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Language UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Language retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        languageCode: { type: 'string' },
        languageName: { type: 'string' },
        scriptSupport: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Language not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.languageService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update language',
    description: 'Updates an existing language with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Language UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Language updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        languageCode: { type: 'string' },
        languageName: { type: 'string' },
        scriptSupport: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Language not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateLanguageDto: UpdateLanguageDto) {
    return this.languageService.update(id, updateLanguageDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete language',
    description: 'Soft deletes a language by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'Language UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Language deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Language deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Language not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.languageService.remove(id);
  }
}
