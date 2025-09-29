import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
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
import { LegalCaseDocumentService } from '../services/legal-case-document.service';
import { DocumentResponseDto, DocumentListResponseDto } from '../dto/document-response.dto';
import { LegalCaseResponseDto } from '../../dto/legal-case-response.dto';

@ApiTags('Legal Case Document Management')
@ApiBearerAuth()
@Controller('legal-cases')
export class LegalCaseDocumentController {
  constructor(private readonly legalCaseDocumentService: LegalCaseDocumentService) {}

  @Post(':caseId/documents/upload')
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
          description: 'Document file to upload (PDF, DOCX, JPG, PNG)',
        },
        documentName: {
          type: 'string',
          description: 'Name/title of the document',
          example: 'Affidavit of John Doe',
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
          description: 'Type of case document',
          example: 'Affidavit',
        },
        hearingDate: {
          type: 'string',
          format: 'date',
          description: 'Date of the hearing this document is related to',
          example: '2025-08-15',
        },
        documentDate: {
          type: 'string',
          format: 'date',
          description: 'Date when the document was created/issued',
          example: '2025-07-21',
        },
        confidentialFlag: {
          type: 'boolean',
          description: 'Whether the document is confidential',
          example: false,
        },
        remarks: {
          type: 'string',
          description: 'Additional remarks about the document',
          example: 'Initial affidavit for case proceedings',
        },
      },
      required: ['file', 'documentName', 'caseDocumentType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case not found',
  })
  async uploadCaseDocument(
    @Param('caseId') caseId: string,
    @UploadedFile() file: any,
    @Body()
    documentData: {
      documentName: string;
      caseDocumentType: string;
      documentType:
        | 'Legal Notice'
        | 'Court Order'
        | 'Affidavit'
        | 'Case Summary'
        | 'Proof'
        | 'Other';
      hearingDate?: string;
      documentDate?: string;
      confidentialFlag?: boolean;
      remarks?: string;
    },
    @Request() req: any,
  ): Promise<DocumentResponseDto> {
    const uploadedBy = req.user?.username || 'admin';

    return this.legalCaseDocumentService.uploadCaseDocument(caseId, file, documentData, uploadedBy);
  }

  @Get(':caseId/documents')
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
    name: 'caseDocumentType',
    required: false,
    type: String,
    description: 'Filter by case document type',
  })
  @ApiQuery({
    name: 'confidentialFlag',
    required: false,
    type: Boolean,
    description: 'Filter by confidentiality flag',
  })
  @ApiQuery({
    name: 'hearingDate',
    required: false,
    type: String,
    description: 'Filter by hearing date',
  })
  @ApiResponse({
    status: 200,
    description: 'Case documents retrieved successfully',
    type: DocumentListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case not found',
  })
  async getCaseDocuments(
    @Param('caseId') caseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('caseDocumentType') caseDocumentType?: string,
    @Query('confidentialFlag') confidentialFlag?: boolean,
    @Query('hearingDate') hearingDate?: string,
  ): Promise<DocumentListResponseDto> {
    const filters = {
      caseDocumentType,
      confidentialFlag,
      hearingDate,
    };

    // Remove undefined filters
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined),
    );

    return this.legalCaseDocumentService.getCaseDocuments(caseId, page, limit, cleanFilters);
  }

  @Get(':caseId/documents/summary')
  @ApiOperation({ summary: 'Get case with documents summary' })
  @ApiParam({ name: 'caseId', description: 'Legal case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Case with documents summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        case: {
          $ref: '#/components/schemas/LegalCaseResponseDto',
        },
        documents: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total number of documents' },
            byType: {
              type: 'object',
              description: 'Document count by type',
              additionalProperties: { type: 'number' },
            },
            recent: {
              type: 'array',
              items: { $ref: '#/components/schemas/DocumentResponseDto' },
              description: 'Recent documents (last 5)',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case not found',
  })
  async getCaseWithDocuments(@Param('caseId') caseId: string): Promise<{
    case: LegalCaseResponseDto;
    documents: {
      total: number;
      byType: Record<string, number>;
      recent: DocumentResponseDto[];
    };
  }> {
    return this.legalCaseDocumentService.getCaseWithDocuments(caseId);
  }

  @Get(':caseId/documents/statistics')
  @ApiOperation({ summary: 'Get document statistics for a legal case' })
  @ApiParam({ name: 'caseId', description: 'Legal case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalDocuments: { type: 'number', description: 'Total number of documents' },
        documentsByType: {
          type: 'object',
          description: 'Document count by type',
          additionalProperties: { type: 'number' },
        },
        documentsByStatus: {
          type: 'object',
          description: 'Document count by status',
          additionalProperties: { type: 'number' },
        },
        totalSize: { type: 'string', description: 'Total size of all documents' },
        averageSize: { type: 'string', description: 'Average document size' },
        lastUploaded: { type: 'string', description: 'Last upload date' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case not found',
  })
  async getCaseDocumentStatistics(@Param('caseId') caseId: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    documentsByStatus: Record<string, number>;
    totalSize: string;
    averageSize: string;
    lastUploaded: string | null;
  }> {
    return this.legalCaseDocumentService.getCaseDocumentStatistics(caseId);
  }

  @Delete(':caseId/documents/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a document from a legal case' })
  @ApiParam({ name: 'caseId', description: 'Legal case UUID' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
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
    status: 400,
    description: 'Bad request - document does not belong to case',
  })
  @ApiResponse({
    status: 404,
    description: 'Legal case or document not found',
  })
  async deleteCaseDocument(
    @Param('caseId') caseId: string,
    @Param('documentId') documentId: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    const deletedBy = req.user?.username || 'admin';

    return this.legalCaseDocumentService.deleteCaseDocument(caseId, documentId, deletedBy);
  }
}
