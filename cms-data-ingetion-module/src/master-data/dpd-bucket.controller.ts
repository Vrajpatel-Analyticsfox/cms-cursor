import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DpdBucketService } from './dpd-bucket.service';
import { CreateDpdBucketDto } from './dto/dpd-bucket';
import { UpdateDpdBucketDto } from './dto/dpd-bucket';

@ApiTags('Master Data - DPD Bucket')
@Controller('master-data/dpd-bucket')
export class DpdBucketController {
  constructor(private readonly dpdBucketService: DpdBucketService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new DPD bucket',
    description: 'Creates a new Days Past Due bucket with range validation and module assignment',
  })
  @ApiResponse({
    status: 201,
    description: 'DPD bucket created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        bucketId: {
          type: 'string',
          example: 'BUCKET_001',
        },
        bucketName: {
          type: 'string',
          example: 'Early Delinquency',
        },
        rangeStart: {
          type: 'number',
          example: -3,
        },
        rangeEnd: {
          type: 'number',
          example: 0,
        },
        module: {
          type: 'string',
          example: 'Digital',
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
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or overlapping ranges',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Range start must be less than or equal to range end' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - bucket ID already exists or overlapping ranges',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Bucket ID already exists or overlapping ranges detected',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  create(@Body() createDpdBucketDto: CreateDpdBucketDto) {
    return this.dpdBucketService.create(createDpdBucketDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all DPD buckets',
    description: 'Retrieves a list of all DPD buckets with optional filtering',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter buckets by status',
    schema: {
      type: 'string',
      enum: ['active', 'inactive'],
      example: 'active',
    },
  })
  @ApiQuery({
    name: 'module',
    required: false,
    description: 'Filter buckets by module',
    schema: {
      type: 'string',
      example: 'Digital',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'DPD buckets retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          bucketId: { type: 'string' },
          bucketName: { type: 'string' },
          rangeStart: { type: 'number' },
          rangeEnd: { type: 'number' },
          module: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  findAll(@Query('status') status?: string, @Query('module') module?: string) {
    // For now, just return all buckets since the service doesn't have filtering methods
    // TODO: Add filtering methods to the service
    return this.dpdBucketService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active DPD buckets',
    description: 'Retrieves a list of all active DPD buckets',
  })
  @ApiResponse({
    status: 200,
    description: 'Active DPD buckets retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          bucketId: { type: 'string' },
          bucketName: { type: 'string' },
          rangeStart: { type: 'number' },
          rangeEnd: { type: 'number' },
          module: { type: 'string' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.dpdBucketService.findActive();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get DPD bucket by ID',
    description: 'Retrieves a specific DPD bucket by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'DPD Bucket UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'DPD bucket retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        bucketId: { type: 'string' },
        bucketName: { type: 'string' },
        rangeStart: { type: 'number' },
        rangeEnd: { type: 'number' },
        module: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'DPD bucket not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'DPD bucket not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.dpdBucketService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update DPD bucket',
    description: 'Updates an existing DPD bucket with new information and range validation',
  })
  @ApiParam({
    name: 'id',
    description: 'DPD Bucket UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'DPD bucket updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        bucketId: { type: 'string' },
        bucketName: { type: 'string' },
        rangeStart: { type: 'number' },
        rangeEnd: { type: 'number' },
        module: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'DPD bucket not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'DPD bucket not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or overlapping ranges',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Range start must be less than or equal to range end' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  update(@Param('id') id: string, @Body() updateDpdBucketDto: UpdateDpdBucketDto) {
    return this.dpdBucketService.update(id, updateDpdBucketDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete DPD bucket',
    description: 'Soft deletes a DPD bucket by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'DPD Bucket UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'DPD bucket deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'DPD bucket deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'DPD bucket not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'DPD bucket not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.dpdBucketService.remove(id);
  }
}
