import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  Logger,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { NoticeAcknowledgementService } from './notice-acknowledgement.service';
import { FileUploadService } from './services/file-upload.service';
import {
  CreateNoticeAcknowledgementDto,
  CreateNoticeAcknowledgementWithDocumentDto,
  UpdateNoticeAcknowledgementDto,
  NoticeAcknowledgementResponseDto,
  NoticeAcknowledgementFilterDto,
  UploadProofDto,
} from './dto';

@ApiTags('Notice Acknowledgement (UC003)')
@Controller('legal/notice-acknowledgements')
@ApiBearerAuth()
export class NoticeAcknowledgementController {
  private readonly logger = new Logger(NoticeAcknowledgementController.name);

  constructor(
    private readonly acknowledgementService: NoticeAcknowledgementService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Notice Acknowledgement (Without Document)',
    description:
      'Creates a new notice acknowledgement record without uploading a document. Use the separate upload endpoint to add documents later.',
  })
  @ApiBody({
    type: CreateNoticeAcknowledgementDto,
    description: 'Notice acknowledgement creation request',
    examples: {
      familyMemberAck: {
        summary: 'Family Member Acknowledgement',
        value: {
          noticeId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          acknowledgedBy: 'Family Member',
          relationshipToBorrower: 'Spouse',
          acknowledgementDate: '2025-07-20T16:30:00Z',
          acknowledgementMode: 'In Person',
          remarks: 'Notice acknowledged by spouse in presence of security guard',
          capturedBy: 'Field Executive - Mumbai Team',
          geoLocation: '19.0760,72.8777',
        },
      },
      courierReceipt: {
        summary: 'Courier Receipt Acknowledgement',
        value: {
          noticeId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          acknowledgedBy: 'Borrower',
          acknowledgementDate: '2025-07-20T14:00:00Z',
          acknowledgementMode: 'Courier Receipt',
          capturedBy: 'System',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Notice acknowledgement created successfully',
    type: NoticeAcknowledgementResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid acknowledgement data',
  })
  @ApiResponse({
    status: 404,
    description: 'Notice not found or not in Sent status',
  })
  @ApiResponse({
    status: 409,
    description: 'Acknowledgement already exists for this notice',
  })
  async createAcknowledgement(
    @Body() createDto: CreateNoticeAcknowledgementDto,
  ): Promise<NoticeAcknowledgementResponseDto> {
    return await this.acknowledgementService.createAcknowledgement(createDto);
  }

  @Post('with-document')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Notice Acknowledgement (With Document)',
    description:
      'Creates a new notice acknowledgement record with an optional proof document in a single request.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Notice acknowledgement creation request with optional document',
    schema: {
      type: 'object',
      properties: {
        noticeId: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the legal notice being acknowledged',
          example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        },
        acknowledgedBy: {
          type: 'string',
          enum: ['Borrower', 'Family Member', 'Lawyer', 'Security Guard', 'Refused'],
          description: 'Who acknowledged the notice',
          example: 'Family Member',
        },
        relationshipToBorrower: {
          type: 'string',
          description: 'Relationship to borrower if not the borrower themselves',
          example: 'Spouse',
        },
        acknowledgementDate: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the notice was acknowledged',
          example: '2025-07-20T16:30:00Z',
        },
        acknowledgementMode: {
          type: 'string',
          enum: ['In Person', 'Courier Receipt', 'Email', 'SMS', 'Phone Call'],
          description: 'Mode of acknowledgement',
          example: 'In Person',
        },
        remarks: {
          type: 'string',
          description: 'Additional remarks or details',
          example: 'Notice acknowledged by spouse in presence of security guard',
        },
        capturedBy: {
          type: 'string',
          description: 'User or role who captured the acknowledgement',
          example: 'Field Executive - Mumbai Team',
        },
        geoLocation: {
          type: 'string',
          description: 'Geographic location coordinates if field-collected',
          example: '19.0760,72.8777',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Proof document file (PDF, JPG, PNG, DOCX) - Optional',
        },
      },
      required: [
        'noticeId',
        'acknowledgedBy',
        'acknowledgementDate',
        'acknowledgementMode',
        'capturedBy',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Notice acknowledgement created successfully with document.',
    type: NoticeAcknowledgementResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data or file upload error.',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Associated notice not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Acknowledgement already exists for this notice.',
  })
  async createAcknowledgementWithDocument(
    @Body() createDto: CreateNoticeAcknowledgementWithDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<NoticeAcknowledgementResponseDto> {
    return await this.acknowledgementService.createAcknowledgementWithDocument(createDto, file);
  }

  @Get()
  @ApiOperation({
    summary: 'Get Notice Acknowledgements',
    description: 'Retrieves notice acknowledgements with filtering and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Notice acknowledgements retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/NoticeAcknowledgementResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 10 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async getAcknowledgements(
    @Query() filterDto: NoticeAcknowledgementFilterDto,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: NoticeAcknowledgementResponseDto[]; pagination: any }> {
    return await this.acknowledgementService.getAcknowledgements(filterDto, page, limit);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get Acknowledgement Statistics (Alias)',
    description: 'Alias for statistics/overview endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Acknowledgement statistics retrieved successfully',
  })
  async getStatistics(@Query() filterDto?: NoticeAcknowledgementFilterDto): Promise<any> {
    return await this.acknowledgementService.getAcknowledgementStatistics(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Notice Acknowledgement by ID',
    description: 'Retrieves a specific notice acknowledgement by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Notice acknowledgement ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Notice acknowledgement retrieved successfully',
    type: NoticeAcknowledgementResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notice acknowledgement not found',
  })
  async getAcknowledgementById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NoticeAcknowledgementResponseDto> {
    return await this.acknowledgementService.getAcknowledgementById(id);
  }

  @Get('notice/:noticeId')
  @ApiOperation({
    summary: 'Get Acknowledgements by Notice ID',
    description: 'Retrieves all acknowledgements for a specific notice',
  })
  @ApiParam({
    name: 'noticeId',
    description: 'Notice ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Notice acknowledgements retrieved successfully',
    type: [NoticeAcknowledgementResponseDto],
  })
  async getAcknowledgementsByNoticeId(
    @Param('noticeId', ParseUUIDPipe) noticeId: string,
  ): Promise<NoticeAcknowledgementResponseDto[]> {
    return await this.acknowledgementService.getAcknowledgementsByNoticeId(noticeId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Notice Acknowledgement',
    description: 'Updates an existing notice acknowledgement record',
  })
  @ApiParam({
    name: 'id',
    description: 'Notice acknowledgement ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiBody({
    type: UpdateNoticeAcknowledgementDto,
    description: 'Notice acknowledgement update request',
    examples: {
      updateStatus: {
        summary: 'Update Acknowledgement Status',
        value: {
          acknowledgementStatus: 'Pending Verification',
          remarks: 'Updated status pending verification of signature',
        },
      },
      addProof: {
        summary: 'Add Proof of Acknowledgement',
        value: {
          proofOfAcknowledgement: '/uploads/acknowledgements/signature_slip.pdf',
          remarks: 'Added signature proof document',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notice acknowledgement updated successfully',
    type: NoticeAcknowledgementResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notice acknowledgement not found',
  })
  async updateAcknowledgement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNoticeAcknowledgementDto,
  ): Promise<NoticeAcknowledgementResponseDto> {
    return await this.acknowledgementService.updateAcknowledgement(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Notice Acknowledgement',
    description: 'Deletes a notice acknowledgement record',
  })
  @ApiParam({
    name: 'id',
    description: 'Notice acknowledgement ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Notice acknowledgement deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Acknowledgement deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Notice acknowledgement not found',
  })
  async deleteAcknowledgement(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return await this.acknowledgementService.deleteAcknowledgement(id);
  }

  @Post(':id/upload-proof')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload Proof of Acknowledgement',
    description:
      'Uploads proof document for notice acknowledgement. If a proof document already exists, it will be replaced with the new file.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notice acknowledgement ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Proof file (PDF, JPG, PNG, DOCX)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Proof file uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        filePath: { type: 'string', example: '/uploads/acknowledgements/signature_slip.pdf' },
        fileName: { type: 'string', example: 'signature_slip.pdf' },
        fileSize: { type: 'number', example: 1024000 },
        replacedExisting: {
          type: 'boolean',
          example: true,
          description: 'Indicates if an existing file was replaced',
        },
        previousFilePath: {
          type: 'string',
          example: '/uploads/acknowledgements/old_signature_slip.pdf',
          description: 'Path of the replaced file (if any)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or file too large',
  })
  @ApiResponse({
    status: 404,
    description: 'Notice acknowledgement not found',
  })
  async uploadProof(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    // Verify acknowledgement exists and get current proof file info
    const acknowledgement = await this.acknowledgementService.getAcknowledgementById(id);

    // Check if proof document already exists
    const hasExistingProof =
      acknowledgement.proofOfAcknowledgement &&
      acknowledgement.proofOfAcknowledgement.trim() !== '';

    if (hasExistingProof) {
      this.logger.warn(
        `Proof document already exists for acknowledgement ${id}. Replacing existing file: ${acknowledgement.proofOfAcknowledgement}`,
      );

      // Delete the old file before uploading new one
      try {
        await this.fileUploadService.deleteFile(acknowledgement.proofOfAcknowledgement!);
        this.logger.log(`Old proof file deleted: ${acknowledgement.proofOfAcknowledgement}`);
      } catch (error) {
        this.logger.warn(`Failed to delete old proof file: ${error.message}`);
        // Continue with upload even if old file deletion fails
      }
    }

    const uploadDto: UploadProofDto = {
      acknowledgementId: id,
      fileType: file.originalname.split('.').pop()?.toUpperCase() || '',
      fileName: file.originalname,
      fileSize: file.size,
    };

    const result = await this.fileUploadService.uploadProofFile(file, uploadDto);

    if (result.success) {
      // Update acknowledgement with new file path
      await this.acknowledgementService.updateAcknowledgementInternal(
        id,
        { proofOfAcknowledgement: result.filePath },
        'system',
      );

      // Add metadata about file replacement
      result.replacedExisting = !!hasExistingProof;
      result.previousFilePath = hasExistingProof ? acknowledgement.proofOfAcknowledgement : null;
    }

    return result;
  }

  @Get(':id/proof')
  @ApiOperation({
    summary: 'Get Proof of Acknowledgement Info',
    description: 'Gets proof file information for notice acknowledgement',
  })
  @ApiParam({
    name: 'id',
    description: 'Notice acknowledgement ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Proof file information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hasProof: { type: 'boolean', example: true },
        filePath: { type: 'string', example: '/uploads/acknowledgements/signature_slip.pdf' },
        fileName: { type: 'string', example: 'signature_slip.pdf' },
        fileSize: { type: 'number', example: 1024000 },
        uploadedAt: { type: 'string', format: 'date-time' },
        mimeType: { type: 'string', example: 'application/pdf' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Notice acknowledgement not found',
  })
  async getProofInfo(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    const acknowledgement = await this.acknowledgementService.getAcknowledgementById(id);

    if (!acknowledgement.proofOfAcknowledgement) {
      return {
        hasProof: false,
        message: 'No proof file found for this acknowledgement',
      };
    }

    return {
      hasProof: true,
      filePath: acknowledgement.proofOfAcknowledgement,
      fileName: acknowledgement.proofOfAcknowledgement.split('/').pop(),
      fileSize: 0, // File size not stored in database
      uploadedAt: acknowledgement.updatedAt,
      mimeType: 'application/octet-stream', // MIME type not stored in database
    };
  }

  @Get(':id/proof/:fileName')
  @ApiOperation({
    summary: 'Download Proof of Acknowledgement',
    description: 'Downloads proof file for notice acknowledgement',
  })
  @ApiParam({
    name: 'id',
    description: 'Notice acknowledgement ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiParam({
    name: 'fileName',
    description: 'Proof file name',
    example: 'signature_slip.pdf',
  })
  @ApiResponse({
    status: 200,
    description: 'Proof file downloaded successfully',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Proof file not found',
  })
  async downloadProof(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Download proof request - ID: ${id}, FileName: ${fileName}`);

      // Verify acknowledgement exists
      const acknowledgement = await this.acknowledgementService.getAcknowledgementById(id);
      this.logger.log(
        `Acknowledgement found: ${JSON.stringify({
          id: acknowledgement.id,
          hasProof: !!acknowledgement.proofOfAcknowledgement,
          proofPath: acknowledgement.proofOfAcknowledgement,
        })}`,
      );

      if (!acknowledgement.proofOfAcknowledgement) {
        throw new NotFoundException('No proof file found for this acknowledgement');
      }

      // Construct the full file path
      const filePath = path.join(process.cwd(), acknowledgement.proofOfAcknowledgement);
      this.logger.log(`Constructed file path: ${filePath}`);
      this.logger.log(`Current working directory: ${process.cwd()}`);
      this.logger.log(`Proof of acknowledgement path: ${acknowledgement.proofOfAcknowledgement}`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        this.logger.error(`File does not exist at path: ${filePath}`);
        this.logger.error(`Directory contents check:`);

        // Check parent directories
        const pathParts = acknowledgement.proofOfAcknowledgement.split('/');
        let currentPath = process.cwd();
        for (const part of pathParts) {
          currentPath = path.join(currentPath, part);
          this.logger.error(`Checking: ${currentPath} - exists: ${fs.existsSync(currentPath)}`);
          if (fs.existsSync(currentPath) && fs.statSync(currentPath).isDirectory()) {
            this.logger.error(`Directory contents: ${fs.readdirSync(currentPath)}`);
          }
        }

        throw new NotFoundException(
          `Proof file not found: ${acknowledgement.proofOfAcknowledgement}`,
        );
      }

      this.logger.log(`File exists, getting stats...`);
      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const mimeType = this.getMimeType(fileName);

      this.logger.log(`File stats - Size: ${fileSize}, MimeType: ${mimeType}`);

      // Set appropriate headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      this.logger.log(`Headers set, starting file stream...`);
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      this.logger.log(`File stream started successfully`);
    } catch (error) {
      this.logger.error(`Error in downloadProof: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Proof file not found or error reading file');
    }
  }

  @Delete(':id/proof')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Proof of Acknowledgement',
    description: 'Deletes proof file for notice acknowledgement',
  })
  @ApiParam({
    name: 'id',
    description: 'Notice acknowledgement ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Proof file deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'File deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Proof file not found',
  })
  async deleteProof(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verify acknowledgement exists and get proof path
    const acknowledgement = await this.acknowledgementService.getAcknowledgementById(id);

    if (!acknowledgement.proofOfAcknowledgement) {
      return { success: false, message: 'No proof file found for this acknowledgement' };
    }

    // Delete file
    const result = await this.fileUploadService.deleteProofFile(
      acknowledgement.proofOfAcknowledgement,
    );

    if (result.success) {
      // Update acknowledgement to remove proof path
      await this.acknowledgementService.updateAcknowledgementInternal(
        id,
        { proofOfAcknowledgement: undefined },
        'system',
      );
    }

    return result;
  }

  @Get('statistics/overview')
  @ApiOperation({
    summary: 'Get Acknowledgement Statistics',
    description: 'Retrieves statistics and analytics for notice acknowledgements',
  })
  @ApiResponse({
    status: 200,
    description: 'Acknowledgement statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              acknowledgementStatus: { type: 'string', example: 'Acknowledged' },
              count: { type: 'number', example: 45 },
            },
          },
        },
        modeStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              acknowledgementMode: { type: 'string', example: 'In Person' },
              count: { type: 'number', example: 30 },
            },
          },
        },
        acknowledgedByStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              acknowledgedBy: { type: 'string', example: 'Family Member' },
              count: { type: 'number', example: 25 },
            },
          },
        },
        recentAcknowledgements: {
          type: 'array',
          items: { $ref: '#/components/schemas/NoticeAcknowledgementResponseDto' },
        },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getAcknowledgementStatistics(
    @Query() filterDto?: NoticeAcknowledgementFilterDto,
  ): Promise<any> {
    return await this.acknowledgementService.getAcknowledgementStatistics(filterDto);
  }

  @Get('file-upload/statistics')
  @ApiOperation({
    summary: 'Get File Upload Statistics',
    description: 'Retrieves statistics for uploaded files with folder structure analysis',
  })
  @ApiQuery({
    name: 'documentType',
    required: false,
    type: String,
    description:
      'Filter by document type (acknowledgements, legal-cases, borrowers, lawyers, templates)',
    example: 'acknowledgements',
  })
  @ApiResponse({
    status: 200,
    description: 'File upload statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalFiles: { type: 'number', example: 150 },
        totalSize: { type: 'number', example: 52428800 },
        fileTypeDistribution: {
          type: 'object',
          properties: {
            PDF: { type: 'number', example: 80 },
            JPG: { type: 'number', example: 45 },
            PNG: { type: 'number', example: 25 },
          },
        },
        folderStructure: {
          type: 'object',
          properties: {
            'acknowledgements/2025/01/21': { type: 'number', example: 10 },
            'acknowledgements/2025/01/22': { type: 'number', example: 15 },
            'legal-cases/2025/01/21/contracts': { type: 'number', example: 5 },
          },
        },
        oldestFile: { type: 'string', format: 'date-time' },
        newestFile: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getFileUploadStatistics(@Query('documentType') documentType?: string): Promise<any> {
    return await this.fileUploadService.getUploadStatistics(documentType);
  }

  @Get(':id/debug-proof')
  @ApiOperation({
    summary: 'Debug Proof File Path',
    description: 'Debug endpoint to check proof file path and existence',
  })
  @ApiParam({
    name: 'id',
    description: 'Notice acknowledgement ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug information retrieved successfully',
  })
  async debugProofFile(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    try {
      // Get acknowledgement
      const acknowledgement = await this.acknowledgementService.getAcknowledgementById(id);

      const debugInfo: any = {
        acknowledgementId: id,
        hasProofOfAcknowledgement: !!acknowledgement.proofOfAcknowledgement,
        proofOfAcknowledgementPath: acknowledgement.proofOfAcknowledgement,
        currentWorkingDirectory: process.cwd(),
        constructedFilePath: acknowledgement.proofOfAcknowledgement
          ? path.join(process.cwd(), acknowledgement.proofOfAcknowledgement)
          : null,
        fileExists: acknowledgement.proofOfAcknowledgement
          ? fs.existsSync(path.join(process.cwd(), acknowledgement.proofOfAcknowledgement))
          : false,
        uploadsDirectoryExists: fs.existsSync(path.join(process.cwd(), 'uploads')),
        acknowledgementsDirectoryExists: fs.existsSync(
          path.join(process.cwd(), 'uploads', 'acknowledgements'),
        ),
        fileSystemInfo: {
          cwd: process.cwd(),
          platform: process.platform,
          nodeVersion: process.version,
        },
        directoryContents: {
          uploads: fs.existsSync(path.join(process.cwd(), 'uploads'))
            ? fs.readdirSync(path.join(process.cwd(), 'uploads'))
            : 'uploads directory not found',
          acknowledgements: fs.existsSync(path.join(process.cwd(), 'uploads', 'acknowledgements'))
            ? fs.readdirSync(path.join(process.cwd(), 'uploads', 'acknowledgements'))
            : 'acknowledgements directory not found',
        },
      };

      // If proof file path exists, check the specific directory structure
      if (acknowledgement.proofOfAcknowledgement) {
        const proofPath = acknowledgement.proofOfAcknowledgement;
        const pathParts = proofPath.split('/');

        debugInfo.detailedPathCheck = {
          pathParts: pathParts,
          year: pathParts[2] || 'not found',
          month: pathParts[3] || 'not found',
          day: pathParts[4] || 'not found',
          filename: pathParts[5] || 'not found',
          yearDirExists: fs.existsSync(
            path.join(process.cwd(), 'uploads', 'acknowledgements', pathParts[2] || ''),
          ),
          monthDirExists: fs.existsSync(
            path.join(
              process.cwd(),
              'uploads',
              'acknowledgements',
              pathParts[2] || '',
              pathParts[3] || '',
            ),
          ),
          dayDirExists: fs.existsSync(
            path.join(
              process.cwd(),
              'uploads',
              'acknowledgements',
              pathParts[2] || '',
              pathParts[3] || '',
              pathParts[4] || '',
            ),
          ),
        };

        // Check if there are any files in the expected directory
        const expectedDir = path.join(
          process.cwd(),
          'uploads',
          'acknowledgements',
          pathParts[2] || '',
          pathParts[3] || '',
          pathParts[4] || '',
        );
        if (fs.existsSync(expectedDir)) {
          debugInfo.detailedPathCheck.filesInDirectory = fs.readdirSync(expectedDir);
        }
      }

      return {
        success: true,
        debugInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
