import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LegalNoticeTemplateService } from '../services/legal-notice-template.service';
import { CreateLegalNoticeTemplateDto } from '../dto/create-legal-notice-template.dto';
import { UpdateLegalNoticeTemplateDto } from '../dto/update-legal-notice-template.dto';
import { LegalNoticeTemplateResponseDto } from '../dto/legal-notice-template-response.dto';

@ApiTags('Legal Notice Templates')
@Controller('legal/legal-notice-templates')
export class LegalNoticeTemplateController {
  constructor(private readonly legalNoticeTemplateService: LegalNoticeTemplateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new legal notice template' })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: LegalNoticeTemplateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or template code already exists',
  })
  async create(
    @Body() createDto: CreateLegalNoticeTemplateDto,
  ): Promise<LegalNoticeTemplateResponseDto> {
    return this.legalNoticeTemplateService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all legal notice templates with pagination and filters' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in template name, code, or description',
  })
  @ApiQuery({
    name: 'templateType',
    required: false,
    type: String,
    description: 'Filter by template type',
  })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('templateType') templateType?: string,
    @Query('status') status?: string,
  ) {
    return this.legalNoticeTemplateService.findAll(page, limit, search, templateType, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a legal notice template by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
    type: LegalNoticeTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LegalNoticeTemplateResponseDto> {
    return this.legalNoticeTemplateService.findOne(id);
  }

  @Get('code/:templateCode')
  @ApiOperation({ summary: 'Get a legal notice template by template code' })
  @ApiParam({ name: 'templateCode', type: String, description: 'Template Code' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
    type: LegalNoticeTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findByCode(
    @Param('templateCode') templateCode: string,
  ): Promise<LegalNoticeTemplateResponseDto> {
    return this.legalNoticeTemplateService.findByCode(templateCode);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a legal notice template' })
  @ApiParam({ name: 'id', type: String, description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: LegalNoticeTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or template code already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLegalNoticeTemplateDto,
  ): Promise<LegalNoticeTemplateResponseDto> {
    return this.legalNoticeTemplateService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a legal notice template (sets isActive to false)' })
  @ApiParam({ name: 'id', type: String, description: 'Template ID' })
  @ApiResponse({ status: 204, description: 'Template soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.legalNoticeTemplateService.remove(id);
  }
}
