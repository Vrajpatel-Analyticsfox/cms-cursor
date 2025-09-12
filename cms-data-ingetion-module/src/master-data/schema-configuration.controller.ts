import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SchemaConfigurationService } from './schema-configuration.service';
import {
  CreateSchemaConfigurationDto,
  UpdateSchemaConfigurationDto,
} from './dto/schema-configuration';

@ApiTags('Master Data - Schema Configuration')
@Controller('master-data/schema-configuration')
export class SchemaConfigurationController {
  constructor(private readonly schemaConfigurationService: SchemaConfigurationService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new schema configuration',
    description: 'Creates a new data ingestion schema configuration',
  })
  @ApiResponse({
    status: 201,
    description: 'Schema configuration created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        schemaId: {
          type: 'string',
          example: 'SCHEMA001',
        },
        schemaName: {
          type: 'string',
          example: 'Customer Data Schema',
        },
        schemaVersion: {
          type: 'string',
          example: '1.0.0',
        },
        schemaDefinition: {
          type: 'object',
          example: { fields: ['name', 'email', 'phone'] },
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'draft'],
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
  async create(@Body() createSchemaConfigurationDto: CreateSchemaConfigurationDto) {
    return this.schemaConfigurationService.create(createSchemaConfigurationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all schema configurations',
    description: 'Retrieves a list of all data ingestion schema configurations',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema configurations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          schemaId: { type: 'string' },
          schemaName: { type: 'string' },
          schemaVersion: { type: 'string' },
          schemaDefinition: { type: 'object' },
          status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findAll() {
    return this.schemaConfigurationService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active schema configurations',
    description: 'Retrieves a list of all active schema configurations',
  })
  @ApiResponse({
    status: 200,
    description: 'Active schema configurations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          schemaId: { type: 'string' },
          schemaName: { type: 'string' },
          schemaVersion: { type: 'string' },
          schemaDefinition: { type: 'object' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.schemaConfigurationService.findActive();
  }

  @Get('by-source-type')
  @ApiOperation({
    summary: 'Get schema configurations by source type',
    description: 'Retrieves schema configurations filtered by source type',
  })
  @ApiQuery({
    name: 'sourceType',
    description: 'Source type to filter by',
    example: 'CSV',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema configurations by source type retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          schemaId: { type: 'string' },
          schemaName: { type: 'string' },
          schemaVersion: { type: 'string' },
          schemaDefinition: { type: 'object' },
          status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findBySourceType(@Query('sourceType') sourceType: string) {
    return this.schemaConfigurationService.findBySourceType(sourceType);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get schema configuration by ID',
    description: 'Retrieves a specific schema configuration by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Schema Configuration UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        schemaId: { type: 'string' },
        schemaName: { type: 'string' },
        schemaVersion: { type: 'string' },
        schemaDefinition: { type: 'object' },
        status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schema configuration not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Schema configuration not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.schemaConfigurationService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update schema configuration',
    description: 'Updates an existing schema configuration with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Schema Configuration UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema configuration updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        schemaId: { type: 'string' },
        schemaName: { type: 'string' },
        schemaVersion: { type: 'string' },
        schemaDefinition: { type: 'object' },
        status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schema configuration not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Schema configuration not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateSchemaConfigurationDto: UpdateSchemaConfigurationDto,
  ) {
    return this.schemaConfigurationService.update(id, updateSchemaConfigurationDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete schema configuration',
    description: 'Soft deletes a schema configuration by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'Schema Configuration UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema configuration deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Schema configuration deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schema configuration not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Schema configuration not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.schemaConfigurationService.remove(id);
  }
}
