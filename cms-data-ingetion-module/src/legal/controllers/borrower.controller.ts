import { Controller, Get, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BorrowerService } from '../services/borrower.service';
import { BorrowerListResponseDto, BorrowerSearchDto } from '../dto/borrower.dto';

@ApiTags('Borrower Management')
@Controller('borrowers')
export class BorrowerController {
  constructor(private readonly borrowerService: BorrowerService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get list of borrowers with search functionality',
    description:
      'Retrieve a paginated list of borrowers with optional search filters. Supports searching by borrower name and loan account number.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for borrower name or loan account number',
    example: 'John Doe',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (borrowerName, loanAccountNumber)',
    example: 'borrowerName',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (asc, desc)',
    example: 'asc',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved borrower list',
    type: BorrowerListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getBorrowers(@Query() searchDto: BorrowerSearchDto): Promise<BorrowerListResponseDto> {
    return this.borrowerService.getBorrowers(searchDto);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search borrowers with advanced filters',
    description: 'Advanced search functionality for borrowers with multiple filter options.',
  })
  @ApiQuery({
    name: 'borrowerName',
    required: false,
    description: 'Filter by borrower name (partial match)',
    example: 'John',
  })
  @ApiQuery({
    name: 'loanAccountNumber',
    required: false,
    description: 'Filter by loan account number (partial match)',
    example: 'LN123',
  })
  @ApiQuery({
    name: 'mobileNumber',
    required: false,
    description: 'Filter by mobile number (partial match)',
    example: '98765',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Filter by email address (partial match)',
    example: 'john@example.com',
  })
  @ApiQuery({
    name: 'productType',
    required: false,
    description: 'Filter by product type',
    example: 'Personal Loan',
  })
  @ApiQuery({
    name: 'branchCode',
    required: false,
    description: 'Filter by branch code',
    example: 'BR001',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved filtered borrower list',
    type: BorrowerListResponseDto,
  })
  async searchBorrowers(@Query() searchDto: BorrowerSearchDto): Promise<BorrowerListResponseDto> {
    return this.borrowerService.searchBorrowers(searchDto);
  }
}

