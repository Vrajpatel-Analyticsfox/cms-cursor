import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductVariantService } from './product-variant.service';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant';

@ApiTags('Master Data - Product Variant')
@Controller('master-data/product-variant')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product variant',
    description: 'Creates a new product variant within a product subtype',
  })
  @ApiResponse({
    status: 201,
    description: 'Product variant created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        variantId: {
          type: 'string',
          example: 'PV001',
        },
        subtypeId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        variantName: {
          type: 'string',
          example: 'iPhone 14 Pro Max',
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
  async create(@Body() createProductVariantDto: CreateProductVariantDto) {
    return this.productVariantService.create(createProductVariantDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all product variants',
    description: 'Retrieves a list of all product variants',
  })
  @ApiResponse({
    status: 200,
    description: 'Product variants retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          variantId: { type: 'string' },
          subtypeId: { type: 'string', format: 'uuid' },
          variantName: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findAll() {
    return this.productVariantService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active product variants',
    description: 'Retrieves a list of all active product variants',
  })
  @ApiResponse({
    status: 200,
    description: 'Active product variants retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          variantId: { type: 'string' },
          subtypeId: { type: 'string', format: 'uuid' },
          variantName: { type: 'string' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.productVariantService.findActive();
  }

  @Get('by-subtype')
  @ApiOperation({
    summary: 'Get product variants by subtype',
    description: 'Retrieves product variants filtered by subtype ID',
  })
  @ApiQuery({
    name: 'subtypeId',
    description: 'Product Subtype UUID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product variants by subtype retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          variantId: { type: 'string' },
          subtypeId: { type: 'string', format: 'uuid' },
          variantName: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findBySubtype(@Query('subtypeId') subtypeId: string) {
    return this.productVariantService.findBySubtype(subtypeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product variant by ID',
    description: 'Retrieves a specific product variant by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Variant UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product variant retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        variantId: { type: 'string' },
        subtypeId: { type: 'string', format: 'uuid' },
        variantName: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product variant not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product variant not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.productVariantService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update product variant',
    description: 'Updates an existing product variant with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Variant UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product variant updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        variantId: { type: 'string' },
        subtypeId: { type: 'string', format: 'uuid' },
        variantName: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product variant not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product variant not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateProductVariantDto: UpdateProductVariantDto) {
    return this.productVariantService.update(id, updateProductVariantDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product variant',
    description: 'Soft deletes a product variant by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'Product Variant UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product variant deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Product variant deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product variant not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product variant not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.productVariantService.remove(id);
  }
}
