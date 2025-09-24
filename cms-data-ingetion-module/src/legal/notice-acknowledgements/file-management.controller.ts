import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
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
import { FileUploadService } from './services/file-upload.service';

@ApiTags('File Management')
@Controller('legal/files')
@ApiBearerAuth()
export class FileManagementController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload/:documentType/:entityId')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload File with Folder Structure',
    description: 'Uploads a file with organized folder structure based on document type and date.',
  })
  @ApiParam({
    name: 'documentType',
    description: 'Type of document (acknowledgements, legal-cases, borrowers, lawyers, templates)',
    example: 'legal-cases',
  })
  @ApiParam({
    name: 'entityId',
    description: 'ID of the entity this file belongs to',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiQuery({
    name: 'subFolder',
    required: false,
    type: String,
    description: 'Optional subfolder within the date folder (e.g., contracts, evidence, proofs)',
    example: 'contracts',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload (PDF, JPG, PNG, DOCX)',
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
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        filePath: {
          type: 'string',
          example: '/uploads/legal-cases/2025/01/21/contracts/case123_1641234567890_a1b2c3d4.pdf',
        },
        fileName: { type: 'string', example: 'case123_1641234567890_a1b2c3d4.pdf' },
        fileSize: { type: 'number', example: 1024000 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid file or upload error.' })
  async uploadFile(
    @Param('documentType') documentType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('subFolder') subFolder: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const result = await this.fileUploadService.uploadFile(file, documentType, entityId, subFolder);

    if (!result.success) {
      throw new NotFoundException(result.error);
    }

    return result;
  }

  @Post('upload/legal-case/:caseId')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload Legal Case Document',
    description: 'Uploads a document for a specific legal case with organized folder structure.',
  })
  @ApiParam({
    name: 'caseId',
    description: 'Legal case ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiQuery({
    name: 'documentType',
    required: true,
    type: String,
    description: 'Type of document (contracts, evidence, correspondence, court-documents)',
    example: 'contracts',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Legal case document file',
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
    status: 201,
    description: 'Legal case document uploaded successfully',
  })
  async uploadLegalCaseDocument(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Query('documentType') documentType: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const result = await this.fileUploadService.uploadLegalCaseDocument(file, caseId, documentType);

    if (!result.success) {
      throw new NotFoundException(result.error);
    }

    return result;
  }

  @Post('upload/borrower/:borrowerId')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload Borrower Document',
    description: 'Uploads a document for a specific borrower with organized folder structure.',
  })
  @ApiParam({
    name: 'borrowerId',
    description: 'Borrower ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiQuery({
    name: 'documentType',
    required: true,
    type: String,
    description: 'Type of document (identity, address-proof, income-proof, bank-statements)',
    example: 'identity',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Borrower document file',
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
    status: 201,
    description: 'Borrower document uploaded successfully',
  })
  async uploadBorrowerDocument(
    @Param('borrowerId', ParseUUIDPipe) borrowerId: string,
    @Query('documentType') documentType: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const result = await this.fileUploadService.uploadBorrowerDocument(
      file,
      borrowerId,
      documentType,
    );

    if (!result.success) {
      throw new NotFoundException(result.error);
    }

    return result;
  }

  @Post('upload/lawyer/:lawyerId')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload Lawyer Document',
    description: 'Uploads a document for a specific lawyer with organized folder structure.',
  })
  @ApiParam({
    name: 'lawyerId',
    description: 'Lawyer ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiQuery({
    name: 'documentType',
    required: true,
    type: String,
    description: 'Type of document (license, credentials, contracts, case-files)',
    example: 'license',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Lawyer document file',
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
    status: 201,
    description: 'Lawyer document uploaded successfully',
  })
  async uploadLawyerDocument(
    @Param('lawyerId', ParseUUIDPipe) lawyerId: string,
    @Query('documentType') documentType: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const result = await this.fileUploadService.uploadLawyerDocument(file, lawyerId, documentType);

    if (!result.success) {
      throw new NotFoundException(result.error);
    }

    return result;
  }

  @Post('upload/template/:templateId')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload Template Document',
    description: 'Uploads a document for a specific template with organized folder structure.',
  })
  @ApiParam({
    name: 'templateId',
    description: 'Template ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiQuery({
    name: 'documentType',
    required: true,
    type: String,
    description: 'Type of document (templates, samples, attachments)',
    example: 'templates',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Template document file',
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
    status: 201,
    description: 'Template document uploaded successfully',
  })
  async uploadTemplateDocument(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Query('documentType') documentType: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const result = await this.fileUploadService.uploadTemplateDocument(
      file,
      templateId,
      documentType,
    );

    if (!result.success) {
      throw new NotFoundException(result.error);
    }

    return result;
  }

  @Get('download/*filePath')
  @ApiOperation({
    summary: 'Download File',
    description: 'Downloads a file by its relative path within the uploads directory.',
  })
  @ApiParam({
    name: 'filePath',
    description: 'Relative file path (e.g., acknowledgements/2025/01/21/filename.pdf)',
    example: 'acknowledgements/2025/01/21/ack123_1641234567890_a1b2c3d4.pdf',
  })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/png': { schema: { type: 'string', format: 'binary' } },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  async downloadFile(@Param('filePath') filePath: string): Promise<Buffer> {
    const fullPath = `/uploads/${filePath}`;
    const fileBuffer = await this.fileUploadService.getProofFile(fullPath);

    if (!fileBuffer) {
      throw new NotFoundException('File not found');
    }

    return fileBuffer;
  }

  @Delete('delete/*filePath')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete File',
    description: 'Deletes a file by its relative path within the uploads directory.',
  })
  @ApiParam({
    name: 'filePath',
    description: 'Relative file path (e.g., acknowledgements/2025/01/21/filename.pdf)',
    example: 'acknowledgements/2025/01/21/ack123_1641234567890_a1b2c3d4.pdf',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'File deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  async deleteFile(
    @Param('filePath') filePath: string,
  ): Promise<{ success: boolean; message: string }> {
    const fullPath = `/uploads/${filePath}`;
    return await this.fileUploadService.deleteProofFile(fullPath);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get File Upload Statistics',
    description:
      'Retrieves comprehensive statistics about uploaded files with folder structure analysis.',
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
  async getFileStatistics(@Query('documentType') documentType?: string): Promise<any> {
    return await this.fileUploadService.getUploadStatistics(documentType);
  }

  @Get('cleanup')
  @ApiOperation({
    summary: 'Cleanup Old Files',
    description: 'Cleans up files older than specified days.',
  })
  @ApiQuery({
    name: 'daysOld',
    required: false,
    type: Number,
    description: 'Number of days old (default: 30)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed successfully',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number', example: 25 },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async cleanupOldFiles(
    @Query('daysOld') daysOld: number = 30,
  ): Promise<{ deletedCount: number; errors: string[] }> {
    return await this.fileUploadService.cleanupOldFiles(daysOld);
  }
}
