import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  HttpStatus,
  HttpException,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CaseIdService } from './case-id.service';
import {
  CaseIdGenerationRequestDto,
  CaseIdGenerationResponseDto,
  CurrentSequenceResponseDto,
  SequenceResetResponseDto,
  AllSequencesResponseDto,
  CaseIdValidationResponseDto,
  HealthCheckResponseDto,
} from './dto/case-id-generation.dto';

@ApiTags('Case ID Generation')
@Controller('legal/case-id')
export class CaseIdController {
  constructor(private readonly caseIdService: CaseIdService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate a unique Case ID',
    description:
      'Generates a unique Case ID following the format: PREFIX-YYYYMMDD-[CATEGORY_CODE-]SEQUENCE. Daily sequence reset per prefix+category combination with atomic updates and uniqueness guarantees.',
  })
  @ApiBody({
    description: 'Case ID generation request parameters',
    type: CaseIdGenerationRequestDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Case ID generated successfully',
    type: CaseIdGenerationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async generateCaseId(
    @Body(new ValidationPipe()) request: CaseIdGenerationRequestDto,
  ): Promise<CaseIdGenerationResponseDto> {
    try {
      const result = await this.caseIdService.generateCaseId(request);

      if (!result.success) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.message,
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error occurred while generating case ID',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sequence/current')
  @ApiOperation({
    summary: 'Get current sequence information',
    description:
      'Retrieves the current sequence information for a specific prefix and category code.',
  })
  @ApiQuery({
    name: 'prefix',
    description: 'Prefix to get sequence for',
    example: 'LC',
    required: true,
  })
  @ApiQuery({
    name: 'categoryCode',
    description: 'Optional category code',
    example: 'MIC',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Current sequence information retrieved successfully',
    type: CurrentSequenceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing required parameters',
  })
  async getCurrentSequence(
    @Query('prefix') prefix: string,
    @Query('categoryCode') categoryCode?: string,
  ): Promise<CurrentSequenceResponseDto> {
    try {
      if (!prefix) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Prefix parameter is required',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const sequence = await this.caseIdService.getCurrentSequence(prefix, categoryCode);

      if (!sequence) {
        return {
          message: 'No sequence found for the specified prefix and category',
          sequence: null,
        };
      }

      return {
        message: 'Sequence information retrieved successfully',
        sequence,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error occurred while retrieving sequence',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('sequence/reset')
  @ApiOperation({
    summary: 'Reset sequence for a specific prefix and category',
    description:
      'Resets the sequence counter to 1 for the specified prefix and category. This is an admin function.',
  })
  @ApiQuery({
    name: 'prefix',
    description: 'Prefix to reset sequence for',
    example: 'LC',
    required: true,
  })
  @ApiQuery({
    name: 'categoryCode',
    description: 'Optional category code',
    example: 'MIC',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Sequence reset successfully',
    type: SequenceResetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing required parameters',
  })
  async resetSequence(
    @Query('prefix') prefix: string,
    @Query('categoryCode') categoryCode?: string,
  ): Promise<SequenceResetResponseDto> {
    try {
      if (!prefix) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Prefix parameter is required',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const success = await this.caseIdService.resetSequence(prefix, categoryCode);

      if (success) {
        return {
          message: 'Sequence reset successfully',
          success: true,
        };
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed to reset sequence',
            error: 'Internal Server Error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error occurred while resetting sequence',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sequence/all')
  @ApiOperation({
    summary: 'Get all sequence records',
    description: 'Retrieves all sequence records for monitoring and administrative purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'All sequence records retrieved successfully',
    type: AllSequencesResponseDto,
  })
  async getAllSequences(): Promise<AllSequencesResponseDto> {
    try {
      const sequences = await this.caseIdService.getAllSequences();

      return {
        message: 'All sequence records retrieved successfully',
        count: sequences.length,
        sequences,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error occurred while retrieving sequences',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('validate')
  @ApiOperation({
    summary: 'Validate if a case ID is unique',
    description: 'Checks if a given case ID already exists in the system.',
  })
  @ApiQuery({
    name: 'caseId',
    description: 'Case ID to validate',
    example: 'LC-20250721-MIC-0001',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Case ID validation completed',
    type: CaseIdValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing case ID parameter',
  })
  async validateCaseId(@Query('caseId') caseId: string): Promise<CaseIdValidationResponseDto> {
    try {
      if (!caseId) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Case ID parameter is required',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const isUnique = await this.caseIdService.isCaseIdUnique(caseId);

      return {
        caseId,
        isUnique,
        message: isUnique
          ? 'Case ID is unique and available'
          : 'Case ID already exists in the system',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error occurred while validating case ID',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Simple health check to verify the service is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthCheckResponseDto,
  })
  async healthCheck(): Promise<HealthCheckResponseDto> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Case ID Generation Service',
    };
  }
}
