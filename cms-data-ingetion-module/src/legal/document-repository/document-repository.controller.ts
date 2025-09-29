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
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { Readable } from 'stream';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { DocumentRepositoryService } from './document-repository.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import {
  DocumentResponseDto,
  DocumentListResponseDto,
  DocumentDownloadResponseDto,
} from './dto/document-response.dto';
import * as fs from 'fs';

@ApiTags('Document Management')
@ApiBearerAuth()
@Controller('legal/documents')
export class DocumentManagementController {
  constructor(private readonly documentRepositoryService: DocumentRepositoryService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document upload with metadata',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload',
        },
        linkedEntityType: {
          type: 'string',
          enum: ['Borrower', 'Loan Account', 'Case ID'],
          description: 'Type of entity this document is linked to (BRD-specified)',
        },
        linkedEntityId: {
          type: 'string',
          description: 'ID of the entity this document is linked to',
        },
        documentName: {
          type: 'string',
          description: 'Name/title of the document (BRD: Max 100 characters)',
        },
        documentType: {
          type: 'string',
          enum: ['Legal Notice', 'Court Order', 'Affidavit', 'Case Summary', 'Proof', 'Other'],
          description: 'Classification of document (BRD-specified)',
        },
        accessPermissions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Access permissions for the document',
        },
        confidentialFlag: {
          type: 'boolean',
          description: 'Whether the document is confidential',
        },
        isPublic: {
          type: 'boolean',
          description: 'Whether the document is public',
        },
        caseDocumentType: {
          type: 'string',
          enum: [
            'Affidavit',
            'Summons',
            'Court Order',
            'Evidence',
            'Witness Statement',
            'Expert Report',
            'Medical Report',
            'Financial Statement',
            'Property Document',
            'Legal Notice',
            'Reply Notice',
            'Counter Affidavit',
            'Interim Order',
            'Final Order',
            'Judgment',
            'Settlement Agreement',
            'Compromise Deed',
            'Power of Attorney',
            'Authorization Letter',
            'Identity Proof',
            'Address Proof',
            'Income Proof',
            'Bank Statement',
            'Loan Agreement',
            'Security Document',
            'Other',
          ],
          description: 'Specific type of case document',
        },
        hearingDate: {
          type: 'string',
          format: 'date',
          description: 'Date of the hearing this document is related to',
        },
        documentDate: {
          type: 'string',
          format: 'date',
          description: 'Date when the document was created/issued',
        },
        remarksTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags or remarks for the document',
        },
      },
      required: ['file', 'linkedEntityType', 'linkedEntityId', 'documentName', 'documentType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or file error',
  })
  @ApiResponse({
    status: 404,
    description: 'Linked entity or document type not found',
  })
  async uploadDocument(
    @UploadedFile() file: any,
    @Body() createDto: CreateDocumentDto,
    @Request() req: any,
  ): Promise<DocumentResponseDto> {
    const uploadedBy = req.user?.username || 'admin';
    return this.documentRepositoryService.uploadDocument(file, createDto, uploadedBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get documents by entity with pagination and filters' })
  @ApiQuery({ name: 'entityType', required: true, type: String, description: 'Type of entity' })
  @ApiQuery({ name: 'entityId', required: true, type: String, description: 'ID of the entity' })
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
    name: 'documentType',
    required: false,
    type: String,
    description: 'Filter by document type',
  })
  @ApiQuery({
    name: 'confidentialFlag',
    required: false,
    type: Boolean,
    description: 'Filter by confidential flag',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: DocumentListResponseDto,
  })
  async getDocumentsByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('documentType') documentType?: string,
    @Query('confidentialFlag') confidentialFlag?: boolean,
  ): Promise<DocumentListResponseDto> {
    const requestedBy = req.user?.username || 'admin';
    const filters = {
      documentType,
      confidentialFlag,
    };

    // Remove undefined filters
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined),
    );

    return this.documentRepositoryService.getDocumentsByEntity(
      entityType,
      entityId,
      requestedBy,
      page,
      limit,
      cleanFilters,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async getDocumentById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<DocumentResponseDto> {
    const requestedBy = req.user?.username || 'admin';
    return this.documentRepositoryService.getDocumentById(id, requestedBy);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document file downloaded successfully',
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
    status: 403,
    description: 'Access denied - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async downloadDocument(
    @Param('id') id: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const requestedBy = req.user?.username || 'admin';
    const userRole = req.user?.role || 'Legal Officer';
    const downloadInfo = await this.documentRepositoryService.downloadDocument(
      id,
      requestedBy,
      userRole,
    );

    // Set response headers
    res.set({
      'Content-Type': downloadInfo.mimeType,
      'Content-Disposition': `attachment; filename="${downloadInfo.fileName}"`,
    });

    // Create buffer stream
    const bufferStream = new Readable();
    bufferStream.push(downloadInfo.buffer);
    bufferStream.push(null);

    return new StreamableFile(bufferStream);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get document versions' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document versions retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async getDocumentVersions(@Param('id') id: string, @Request() req: any): Promise<any> {
    const requestedBy = req.user?.username || 'admin';
    const userRole = req.user?.role || 'Legal Officer';
    return this.documentRepositoryService.getDocumentVersions(id, requestedBy, userRole);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create new document version' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 201,
    description: 'New version created successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async createDocumentVersion(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('changeSummary') changeSummary: string,
    @Request() req: any,
  ): Promise<DocumentResponseDto> {
    const createdBy = req.user?.username || 'admin';
    const userRole = req.user?.role || 'Legal Officer';
    return this.documentRepositoryService.createDocumentVersion(
      id,
      file,
      changeSummary,
      createdBy,
      userRole,
    );
  }

  @Get(':id/debug')
  @ApiOperation({ summary: 'Debug document and version info' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async debugDocument(@Param('id') id: string): Promise<any> {
    return this.documentRepositoryService.debugDocument(id);
  }

  @Post(':id/fix-version-1')
  @ApiOperation({ summary: 'Fix missing version 1 for document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async fixVersion1(@Param('id') id: string): Promise<any> {
    return this.documentRepositoryService.fixVersion1(id);
  }

  @Post(':id/rollback/:versionNumber')
  @ApiOperation({ summary: 'Rollback to specific version' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number to rollback to' })
  @ApiResponse({
    status: 200,
    description: 'Document rolled back successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Document or version not found',
  })
  async rollbackToVersion(
    @Param('id') id: string,
    @Param('versionNumber') versionNumber: number,
    @Request() req: any,
  ): Promise<DocumentResponseDto> {
    const rollbackBy = req.user?.username || 'admin';
    const userRole = req.user?.role || 'Legal Officer';
    return this.documentRepositoryService.rollbackToVersion(
      id,
      versionNumber,
      rollbackBy,
      userRole,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
    @Request() req: any,
  ): Promise<DocumentResponseDto> {
    const updatedBy = req.user?.username || 'admin';
    return this.documentRepositoryService.updateDocument(id, updateDto, updatedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async deleteDocument(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    const deletedBy = req.user?.username || 'admin';
    return this.documentRepositoryService.deleteDocument(id, deletedBy);
  }

  // Legal Case specific endpoints
  @Get('legal-case/:caseId')
  @ApiOperation({ summary: 'Get all documents for a legal case' })
  @ApiParam({ name: 'caseId', description: 'Legal case UUID' })
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
    name: 'documentType',
    required: false,
    type: String,
    description: 'Filter by document type',
  })
  @ApiResponse({
    status: 200,
    description: 'Legal case documents retrieved successfully',
    type: DocumentListResponseDto,
  })
  async getLegalCaseDocuments(
    @Param('caseId') caseId: string,
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('documentType') documentType?: string,
  ): Promise<DocumentListResponseDto> {
    const requestedBy = req.user?.username || 'admin';
    const filters = {
      documentType,
    };

    // Remove undefined filters
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined),
    );

    return this.documentRepositoryService.getDocumentsByEntity(
      'Legal Case',
      caseId,
      requestedBy,
      page,
      limit,
      cleanFilters,
    );
  }

  @Post('legal-case/:caseId/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload document for a legal case' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'caseId', description: 'Legal case UUID' })
  @ApiBody({
    description: 'Document upload for legal case',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload',
        },
        documentName: {
          type: 'string',
          description: 'Name/title of the document (BRD: Max 100 characters)',
        },
        documentType: {
          type: 'string',
          enum: ['Legal Notice', 'Court Order', 'Affidavit', 'Case Summary', 'Proof', 'Other'],
          description: 'Classification of document (BRD-specified)',
        },
        accessPermissions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Access permissions for the document',
        },
        confidentialFlag: {
          type: 'boolean',
          description: 'Whether the document is confidential',
        },
        remarksTags: {
          type: 'string',
          description: 'Tags or remarks for the document (BRD: Max 250 characters)',
        },
      },
      required: ['file', 'documentName', 'documentType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully for legal case',
    type: DocumentResponseDto,
  })
  async uploadLegalCaseDocument(
    @Param('caseId') caseId: string,
    @UploadedFile() file: any,
    @Body() body: any,
    @Request() req: any,
  ): Promise<DocumentResponseDto> {
    const uploadedBy = req.user?.username || 'admin';

    const createDto: CreateDocumentDto = {
      linkedEntityType: 'Case ID',
      linkedEntityId: caseId,
      documentName: body.documentName,
      documentType: body.documentType,
      accessPermissions: body.accessPermissions
        ? JSON.parse(body.accessPermissions)
        : ['Legal Officer'],
      confidentialFlag: body.confidentialFlag === 'true',
      remarksTags: body.remarksTags,
    };

    return this.documentRepositoryService.uploadDocument(file, createDto, uploadedBy);
  }
}
