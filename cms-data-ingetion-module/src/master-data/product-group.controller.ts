import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductGroupService } from './product-group.service';
import { CreateProductGroupDto, UpdateProductGroupDto } from './dto/product-group';

@ApiTags('Master Data - Product Group')
@Controller('master-data/product-group')
export class ProductGroupController {
  constructor(private readonly productGroupService: ProductGroupService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product group',
    description: 'Creates a new product group for categorization',
  })
  @ApiResponse({
    status: 201,
    description: 'Product group created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        groupId: {
          type: 'string',
          example: 'PG001',
        },
        groupName: {
          type: 'string',
          example: 'Electronics',
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
  async create(@Body() createProductGroupDto: CreateProductGroupDto) {
    return this.productGroupService.create(createProductGroupDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all product groups',
    description: 'Retrieves a list of all product groups',
  })
  @ApiResponse({
    status: 200,
    description: 'Product groups retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          groupId: { type: 'string' },
          groupName: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findAll() {
    return this.productGroupService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active product groups',
    description: 'Retrieves a list of all active product groups',
  })
  @ApiResponse({
    status: 200,
    description: 'Active product groups retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          groupId: { type: 'string' },
          groupName: { type: 'string' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.productGroupService.findActive();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product group by ID',
    description: 'Retrieves a specific product group by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Group UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product group retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        groupId: { type: 'string' },
        groupName: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product group not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product group not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.productGroupService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update product group',
    description: 'Updates an existing product group with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Group UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product group updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        groupId: { type: 'string' },
        groupName: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product group not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product group not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateProductGroupDto: UpdateProductGroupDto) {
    return this.productGroupService.update(id, updateProductGroupDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product group',
    description: 'Soft deletes a product group by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Group UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product group deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Product group deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product group not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product group not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.productGroupService.remove(id);
  }
}
