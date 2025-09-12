import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductSubtypeService } from './product-subtype.service';
import { CreateProductSubtypeDto, UpdateProductSubtypeDto } from './dto/product-subtype';

@ApiTags('Master Data - Product Subtype')
@Controller('master-data/product-subtype')
export class ProductSubtypeController {
  constructor(private readonly productSubtypeService: ProductSubtypeService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product subtype',
    description: 'Creates a new product subtype within a product type',
  })
  @ApiResponse({
    status: 201,
    description: 'Product subtype created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        subtypeId: {
          type: 'string',
          example: 'PST001',
        },
        typeId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        subtypeName: {
          type: 'string',
          example: 'Android Phones',
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
  async create(@Body() createProductSubtypeDto: CreateProductSubtypeDto) {
    return this.productSubtypeService.create(createProductSubtypeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all product subtypes',
    description: 'Retrieves a list of all product subtypes',
  })
  @ApiResponse({
    status: 200,
    description: 'Product subtypes retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          subtypeId: { type: 'string' },
          typeId: { type: 'string', format: 'uuid' },
          subtypeName: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findAll() {
    return this.productSubtypeService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active product subtypes',
    description: 'Retrieves a list of all active product subtypes',
  })
  @ApiResponse({
    status: 200,
    description: 'Active product subtypes retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          subtypeId: { type: 'string' },
          typeId: { type: 'string', format: 'uuid' },
          subtypeName: { type: 'string' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.productSubtypeService.findActive();
  }

  @Get('by-type')
  @ApiOperation({
    summary: 'Get product subtypes by type',
    description: 'Retrieves product subtypes filtered by type ID',
  })
  @ApiQuery({
    name: 'typeId',
    description: 'Product Type UUID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product subtypes by type retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          subtypeId: { type: 'string' },
          typeId: { type: 'string', format: 'uuid' },
          subtypeName: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findByType(@Query('typeId') typeId: string) {
    return this.productSubtypeService.findByType(typeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product subtype by ID',
    description: 'Retrieves a specific product subtype by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Subtype UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product subtype retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        subtypeId: { type: 'string' },
        typeId: { type: 'string', format: 'uuid' },
        subtypeName: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product subtype not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product subtype not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.productSubtypeService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update product subtype',
    description: 'Updates an existing product subtype with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Subtype UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product subtype updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        subtypeId: { type: 'string' },
        typeId: { type: 'string', format: 'uuid' },
        subtypeName: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product subtype not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product subtype not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateProductSubtypeDto: UpdateProductSubtypeDto) {
    return this.productSubtypeService.update(id, updateProductSubtypeDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product subtype',
    description: 'Soft deletes a product subtype by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Subtype UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product subtype deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Product subtype deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product subtype not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product subtype not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.productSubtypeService.remove(id);
  }
}
