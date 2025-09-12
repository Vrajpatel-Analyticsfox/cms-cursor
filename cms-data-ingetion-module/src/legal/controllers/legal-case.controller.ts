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
} from '@nestjs/swagger';
import { LegalCaseService } from '../services/legal-case.service';
import { CreateLegalCaseDto } from '../dto/create-legal-case.dto';
import { UpdateLegalCaseDto } from '../dto/update-legal-case.dto';
import { LegalCaseResponseDto, LegalCaseListResponseDto } from '../dto/legal-case-response.dto';

@ApiTags('Legal Case Management')
@ApiBearerAuth()
@Controller('legal-cases')
export class LegalCaseController {
  constructor(private readonly legalCaseService: LegalCaseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new legal case' })
  @ApiResponse({
    status: 201,
    description: 'Legal case created successfully',
    type: LegalCaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Loan account or lawyer not found',
  })
  async createLegalCase(
    @Body() createDto: CreateLegalCaseDto,
    @Request() req: any,
  ): Promise<LegalCaseResponseDto> {
    const createdBy = req.user?.username || 'system';
    return this.legalCaseService.createLegalCase(createDto, createdBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all legal cases with pagination and filters' })
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
  @ApiQuery({ name: 'caseType', required: false, type: String, description: 'Filter by case type' })
  @ApiQuery({
    name: 'currentStatus',
    required: false,
    type: String,
    description: 'Filter by current status',
  })
  @ApiQuery({
    name: 'lawyerAssignedId',
    required: false,
    type: String,
    description: 'Filter by assigned lawyer ID',
  })
  @ApiQuery({
    name: 'loanAccountNumber',
    required: false,
    type: String,
    description: 'Filter by loan account number',
  })
  @ApiQuery({
    name: 'borrowerName',
    required: false,
    type: String,
    description: 'Filter by borrower name',
  })
  @ApiResponse({
    status: 200,
    description: 'Legal cases retrieved successfully',
    type: LegalCaseListResponseDto,
  })
  async getLegalCases(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('caseType') caseType?: string,
    @Query('currentStatus') currentStatus?: string,
    @Query('lawyerAssignedId') lawyerAssignedId?: string,
    @Query('loanAccountNumber') loanAccountNumber?: string,
    @Query('borrowerName') borrowerName?: string,
  ): Promise<LegalCaseListResponseDto> {
    const filters = {
      caseType,
      currentStatus,
      lawyerAssignedId,
      loanAccountNumber,
      borrowerName,
    };

    // Remove undefined filters
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined),
    );

    return this.legalCaseService.getLegalCases(page, limit, cleanFilters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get legal case by ID' })
  @ApiParam({ name: 'id', description: 'Legal case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Legal case retrieved successfully',
    type: LegalCaseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case not found',
  })
  async getLegalCaseById(@Param('id') id: string): Promise<LegalCaseResponseDto> {
    return this.legalCaseService.getLegalCaseById(id);
  }

  @Get('case-id/:caseId')
  @ApiOperation({ summary: 'Get legal case by case ID' })
  @ApiParam({ name: 'caseId', description: 'Legal case ID (e.g., LC-20250721-0001)' })
  @ApiResponse({
    status: 200,
    description: 'Legal case retrieved successfully',
    type: LegalCaseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case not found',
  })
  async getLegalCaseByCaseId(@Param('caseId') caseId: string): Promise<LegalCaseResponseDto> {
    return this.legalCaseService.getLegalCaseByCaseId(caseId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update legal case' })
  @ApiParam({ name: 'id', description: 'Legal case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Legal case updated successfully',
    type: LegalCaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case not found',
  })
  async updateLegalCase(
    @Param('id') id: string,
    @Body() updateDto: UpdateLegalCaseDto,
    @Request() req: any,
  ): Promise<LegalCaseResponseDto> {
    const updatedBy = req.user?.username || 'system';
    return this.legalCaseService.updateLegalCase(id, updateDto, updatedBy);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update legal case status' })
  @ApiParam({ name: 'id', description: 'Legal case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Case status updated successfully',
    type: LegalCaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case not found',
  })
  async updateCaseStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'Filed' | 'Under Trial' | 'Stayed' | 'Dismissed' | 'Resolved' | 'Closed';
      caseClosureDate?: string;
      outcomeSummary?: string;
    },
    @Request() req: any,
  ): Promise<LegalCaseResponseDto> {
    const updatedBy = req.user?.username || 'system';
    return this.legalCaseService.updateCaseStatus(
      id,
      body.status,
      updatedBy,
      body.caseClosureDate,
      body.outcomeSummary,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete legal case' })
  @ApiParam({ name: 'id', description: 'Legal case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Legal case deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case not found',
  })
  async deleteLegalCase(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    const deletedBy = req.user?.username || 'system';
    return this.legalCaseService.deleteLegalCase(id, deletedBy);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get legal cases by status' })
  @ApiParam({
    name: 'status',
    description: 'Case status',
    enum: ['Filed', 'Under Trial', 'Stayed', 'Dismissed', 'Resolved', 'Closed'],
  })
  @ApiResponse({
    status: 200,
    description: 'Legal cases retrieved successfully',
    type: [LegalCaseResponseDto],
  })
  async getCasesByStatus(@Param('status') status: string): Promise<LegalCaseResponseDto[]> {
    return this.legalCaseService.getCasesByStatus(status);
  }

  @Get('lawyer/:lawyerId')
  @ApiOperation({ summary: 'Get legal cases by assigned lawyer' })
  @ApiParam({ name: 'lawyerId', description: 'Lawyer UUID' })
  @ApiResponse({
    status: 200,
    description: 'Legal cases retrieved successfully',
    type: [LegalCaseResponseDto],
  })
  async getCasesByLawyer(@Param('lawyerId') lawyerId: string): Promise<LegalCaseResponseDto[]> {
    return this.legalCaseService.getCasesByLawyer(lawyerId);
  }
}
