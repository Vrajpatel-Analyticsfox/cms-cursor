import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LawyerAllocationService } from './lawyer-allocation.service';
import {
  CreateLawyerAllocationDto,
  UpdateLawyerAllocationDto,
  LawyerAllocationResponseDto,
  LawyerAllocationListResponseDto,
  LawyerAllocationFilterDto,
} from './dto';

@ApiTags('Lawyer Allocation Workflow (UC008)')
@ApiBearerAuth()
@Controller('legal/lawyer-allocations')
export class LawyerAllocationController {
  constructor(private readonly lawyerAllocationService: LawyerAllocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new lawyer allocation',
    description: 'Assign a lawyer to a legal case following BRD UC008 specifications',
  })
  @ApiBody({ type: CreateLawyerAllocationDto })
  @ApiResponse({
    status: 201,
    description: 'Lawyer allocation created successfully',
    type: LawyerAllocationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - case already has an active allocation',
  })
  async createAllocation(
    @Body() createDto: CreateLawyerAllocationDto,
    @Request() req: any,
  ): Promise<LawyerAllocationResponseDto> {
    return await this.lawyerAllocationService.createAllocation(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get lawyer allocations with filtering and pagination',
    description: 'Retrieve lawyer allocations with optional filtering and pagination',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Lawyer allocations retrieved successfully',
    type: LawyerAllocationListResponseDto,
  })
  async getAllocations(
    @Query() filterDto: LawyerAllocationFilterDto,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<LawyerAllocationListResponseDto> {
    return await this.lawyerAllocationService.getAllocations(filterDto, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get lawyer allocation by ID',
    description: 'Retrieve a specific lawyer allocation with related case and lawyer details',
  })
  @ApiParam({
    name: 'id',
    description: 'Lawyer allocation ID',
    example: 'uuid-allocation-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Lawyer allocation retrieved successfully',
    type: LawyerAllocationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Lawyer allocation not found',
  })
  async getAllocationById(@Param('id') id: string): Promise<LawyerAllocationResponseDto> {
    return await this.lawyerAllocationService.getAllocationById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update lawyer allocation',
    description: 'Update an existing lawyer allocation following BRD UC008 specifications',
  })
  @ApiParam({
    name: 'id',
    description: 'Lawyer allocation ID',
    example: 'uuid-allocation-id',
  })
  @ApiBody({ type: UpdateLawyerAllocationDto })
  @ApiResponse({
    status: 200,
    description: 'Lawyer allocation updated successfully',
    type: LawyerAllocationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Lawyer allocation not found',
  })
  async updateAllocation(
    @Param('id') id: string,
    @Body() updateDto: UpdateLawyerAllocationDto,
    @Request() req: any,
  ): Promise<LawyerAllocationResponseDto> {
    return await this.lawyerAllocationService.updateAllocation(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete lawyer allocation',
    description: 'Delete a lawyer allocation',
  })
  @ApiParam({
    name: 'id',
    description: 'Lawyer allocation ID',
    example: 'uuid-allocation-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Lawyer allocation deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Lawyer allocation deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Lawyer allocation not found',
  })
  async deleteAllocation(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    return await this.lawyerAllocationService.deleteAllocation(id);
  }

  @Get('case/:caseId')
  @ApiOperation({
    summary: 'Get allocations by case ID',
    description: 'Retrieve all lawyer allocations for a specific case',
  })
  @ApiParam({
    name: 'caseId',
    description: 'Case ID',
    example: 'uuid-case-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Case allocations retrieved successfully',
    type: [LawyerAllocationResponseDto],
  })
  async getAllocationsByCaseId(
    @Param('caseId') caseId: string,
  ): Promise<LawyerAllocationResponseDto[]> {
    return await this.lawyerAllocationService.getAllocationsByCaseId(caseId);
  }

  @Get('lawyer/:lawyerId')
  @ApiOperation({
    summary: 'Get allocations by lawyer ID',
    description: 'Retrieve all lawyer allocations for a specific lawyer',
  })
  @ApiParam({
    name: 'lawyerId',
    description: 'Lawyer ID',
    example: 'uuid-lawyer-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Lawyer allocations retrieved successfully',
    type: [LawyerAllocationResponseDto],
  })
  async getAllocationsByLawyerId(
    @Param('lawyerId') lawyerId: string,
  ): Promise<LawyerAllocationResponseDto[]> {
    return await this.lawyerAllocationService.getAllocationsByLawyerId(lawyerId);
  }
}
