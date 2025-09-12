import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductTypeService } from './product-type.service';
import { CreateProductTypeDto, UpdateProductTypeDto } from './dto/product-type';

@ApiTags('Master Data - Product Type')
@Controller('master-data/product-type')
export class ProductTypeController {
  constructor(private readonly productTypeService: ProductTypeService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product type',
    description: 'Creates a new product type within a product group',
  })
  @ApiResponse({
    status: 201,
    description: 'Product type created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        typeId: {
          type: 'string',
          example: 'PT001',
        },
        groupId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        typeName: {
          type: 'string',
          example: 'Smartphones',
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
  async create(@Body() createProductTypeDto: CreateProductTypeDto) {
    return this.productTypeService.create(createProductTypeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all product types',
    description: 'Retrieves a list of all product types',
  })
  @ApiResponse({
    status: 200,
    description: 'Product types retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          typeId: { type: 'string' },
          groupId: { type: 'string', format: 'uuid' },
          typeName: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findAll() {
    return this.productTypeService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active product types',
    description: 'Retrieves a list of all active product types',
  })
  @ApiResponse({
    status: 200,
    description: 'Active product types retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          typeId: { type: 'string' },
          groupId: { type: 'string', format: 'uuid' },
          typeName: { type: 'string' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.productTypeService.findActive();
  }

  @Get('by-group')
  @ApiOperation({
    summary: 'Get product types by group',
    description: 'Retrieves product types filtered by group ID',
  })
  @ApiQuery({
    name: 'groupId',
    description: 'Product Group UUID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product types by group retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          typeId: { type: 'string' },
          groupId: { type: 'string', format: 'uuid' },
          typeName: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findByGroup(@Query('groupId') groupId: string) {
    return this.productTypeService.findByGroup(groupId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product type by ID',
    description: 'Retrieves a specific product type by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product type retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        typeId: { type: 'string' },
        groupId: { type: 'string', format: 'uuid' },
        typeName: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product type not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product type not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.productTypeService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update product type',
    description: 'Updates an existing product type with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product type updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        typeId: { type: 'string' },
        groupId: { type: 'string', format: 'uuid' },
        typeName: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product type not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product type not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateProductTypeDto: UpdateProductTypeDto) {
    return this.productTypeService.update(id, updateProductTypeDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product type',
    description: 'Soft deletes a product type by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product type deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Product type deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product type not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product type not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.productTypeService.remove(id);
  }
}
