import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  ParseArrayPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { fileTypeFilter } from '../filters/file-type.filter';
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
import { LegalCaseEnhancedService } from '../services/legal-case-enhanced.service';
import { CreateLegalCaseWithDocumentsDto } from '../dto/create-legal-case-with-documents.dto';
import { UpdateLegalCaseWithDocumentsDto } from '../dto/update-legal-case-with-documents.dto';
import { LegalCaseResponseDto } from '../dto/legal-case-response.dto';
import { DocumentResponseDto } from '../document-repository/dto/document-response.dto';

@ApiTags('Legal Case Management with Documents')
@ApiBearerAuth()
@Controller('legal/legal-cases-enhanced')
export class LegalCaseEnhancedController {
  constructor(private readonly legalCaseEnhancedService: LegalCaseEnhancedService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 10, { fileFilter: fileTypeFilter })) // Allow up to 10 files
  @ApiOperation({ summary: 'Create legal case with documents' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create legal case with optional document uploads',
    schema: {
      type: 'object',
      properties: {
        // Case fields
        loanAccountNumber: {
          type: 'string',
          description: 'Loan account number of the borrower',
          example: 'LN4567890',
        },
        caseType: {
          type: 'string',
          enum: ['Civil', 'Criminal', 'Arbitration', '138 Bounce', 'SARFAESI'],
          description: 'Type of legal case initiated',
          example: 'Civil',
        },
        courtName: {
          type: 'string',
          description: 'Court where the case is filed',
          example: 'Mumbai Sessions Court',
        },
        caseFiledDate: {
          type: 'string',
          format: 'date',
          description: 'Date of formal case filing',
          example: '2025-07-21',
        },
        lawyerAssignedId: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the lawyer assigned to the case',
          example: 'uuid-lawyer-id',
        },
        filingJurisdiction: {
          type: 'string',
          description: 'Court location/state/district',
          example: 'Mumbai, Maharashtra',
        },
        currentStatus: {
          type: 'string',
          enum: ['Filed', 'Under Trial', 'Stayed', 'Dismissed', 'Resolved', 'Closed'],
          description: 'Present legal state of the case',
          example: 'Filed',
        },
        nextHearingDate: {
          type: 'string',
          format: 'date',
          description: 'Scheduled date for next hearing',
          example: '2025-08-15',
        },
        lastHearingOutcome: {
          type: 'string',
          description: 'Remarks or decisions from last hearing',
          example: 'Case adjourned to next hearing date',
        },
        recoveryActionLinked: {
          type: 'string',
          enum: ['Repossession', 'Settlement', 'Warrant Issued', 'None'],
          description: 'If case resulted in any recovery action',
          example: 'None',
        },
        caseRemarks: {
          type: 'string',
          description: 'Internal notes for tracking',
          example: 'Initial case filing for loan default',
        },
        caseClosureDate: {
          type: 'string',
          format: 'date',
          description: 'Date on which case was officially closed',
          example: '2025-12-31',
        },
        outcomeSummary: {
          type: 'string',
          description: 'Final decision or resolution notes',
          example: 'Case resolved through settlement agreement',
        },
        // Document fields
        documents: {
          type: 'array',
          description: 'Documents to upload with the case',
          items: {
            type: 'object',
            properties: {
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
            required: ['documentName', 'caseDocumentType'],
          },
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Document files to upload (PDF, DOCX, JPG, PNG)',
        },
      },
      required: [
        'loanAccountNumber',
        'caseType',
        'courtName',
        'caseFiledDate',
        'filingJurisdiction',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Legal case created successfully with documents',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            case: { $ref: '#/components/schemas/LegalCaseResponseDto' },
            documents: {
              type: 'array',
              items: { $ref: '#/components/schemas/DocumentResponseDto' },
            },
            summary: {
              type: 'object',
              properties: {
                totalDocuments: { type: 'number' },
                documentsByType: {
                  type: 'object',
                  additionalProperties: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async createLegalCaseWithDocuments(
    @Body() createDto: CreateLegalCaseWithDocumentsDto,
    @UploadedFiles() files: any[],
    @Request() req: any,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      case: LegalCaseResponseDto;
      documents: DocumentResponseDto[];
      summary: {
        totalDocuments: number;
        documentsByType: Record<string, number>;
      };
    };
  }> {
    const createdBy = req.user?.username || 'system';

    console.log('=== CONTROLLER DEBUG ===');
    console.log('createDto received:', createDto);
    console.log('files received:', files);
    console.log('files length:', files?.length);

    // Manual parsing of documents if it's a string
    if (typeof createDto.documents === 'string') {
      try {
        createDto.documents = JSON.parse(createDto.documents);
        console.log('Manually parsed documents in controller:', createDto.documents);
      } catch (error) {
        console.error('Error parsing documents in controller:', error);
        createDto.documents = [];
      }
    }

    console.log('=== END CONTROLLER DEBUG ===');

    const result = await this.legalCaseEnhancedService.createLegalCaseWithDocuments(
      createDto,
      files || [],
      createdBy,
    );

    return {
      success: true,
      message: `Legal case created successfully with ${result.documents.length} documents`,
      data: result,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 10, { fileFilter: fileTypeFilter }))
  @ApiOperation({ summary: 'Update legal case with documents' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Legal case UUID' })
  @ApiBody({
    description: 'Update legal case with optional document operations',
    schema: {
      type: 'object',
      properties: {
        // Case fields (all optional for update)
        loanAccountNumber: { type: 'string' },
        caseType: { type: 'string' },
        courtName: { type: 'string' },
        caseFiledDate: { type: 'string', format: 'date' },
        lawyerAssignedId: { type: 'string', format: 'uuid' },
        filingJurisdiction: { type: 'string' },
        currentStatus: { type: 'string' },
        nextHearingDate: { type: 'string', format: 'date' },
        lastHearingOutcome: { type: 'string' },
        recoveryActionLinked: { type: 'string' },
        caseRemarks: { type: 'string' },
        caseClosureDate: { type: 'string', format: 'date' },
        outcomeSummary: { type: 'string' },
        // Document operations
        documentsToAdd: {
          type: 'array',
          description: 'Documents to add to the case',
          items: {
            type: 'object',
            properties: {
              documentName: { type: 'string' },
              caseDocumentType: { type: 'string' },
              hearingDate: { type: 'string', format: 'date' },
              documentDate: { type: 'string', format: 'date' },
              confidentialFlag: { type: 'boolean' },
              remarks: { type: 'string' },
            },
          },
        },
        documentsToRemove: {
          type: 'array',
          items: { type: 'string' },
          description: 'Document IDs to remove from the case',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Document files to upload (for documentsToAdd)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Legal case updated successfully with documents',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            case: { $ref: '#/components/schemas/LegalCaseResponseDto' },
            documentsAdded: {
              type: 'array',
              items: { $ref: '#/components/schemas/DocumentResponseDto' },
            },
            documentsRemoved: { type: 'array', items: { type: 'string' } },
            summary: {
              type: 'object',
              properties: {
                totalDocuments: { type: 'number' },
                documentsByType: {
                  type: 'object',
                  additionalProperties: { type: 'number' },
                },
              },
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
  async updateLegalCaseWithDocuments(
    @Param('id') caseId: string,
    @Body() updateDto: UpdateLegalCaseWithDocumentsDto,
    @UploadedFiles() files: any[],
    @Request() req: any,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      case: LegalCaseResponseDto;
      documentsAdded: DocumentResponseDto[];
      documentsRemoved: string[];
      summary: {
        totalDocuments: number;
        documentsByType: Record<string, number>;
      };
    };
  }> {
    const updatedBy = req.user?.username || 'system';

    const result = await this.legalCaseEnhancedService.updateLegalCaseWithDocuments(
      caseId,
      updateDto,
      files || [],
      updatedBy,
    );

    return {
      success: true,
      message: `Legal case updated successfully. Added: ${result.documentsAdded.length}, Removed: ${result.documentsRemoved.length}`,
      data: result,
    };
  }

  @Get(':id/with-documents')
  @ApiOperation({ summary: 'Get legal case with documents summary' })
  @ApiParam({ name: 'id', description: 'Legal case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Legal case with documents retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            case: { $ref: '#/components/schemas/LegalCaseResponseDto' },
            documents: {
              type: 'array',
              items: { $ref: '#/components/schemas/DocumentResponseDto' },
            },
            summary: {
              type: 'object',
              properties: {
                totalDocuments: { type: 'number' },
                documentsByType: {
                  type: 'object',
                  additionalProperties: { type: 'number' },
                },
                recentDocuments: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/DocumentResponseDto' },
                },
              },
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
  async getLegalCaseWithDocuments(@Param('id') caseId: string): Promise<{
    success: boolean;
    data: {
      case: LegalCaseResponseDto;
      documents: DocumentResponseDto[];
      summary: {
        totalDocuments: number;
        documentsByType: Record<string, number>;
        recentDocuments: DocumentResponseDto[];
      };
    };
  }> {
    const result = await this.legalCaseEnhancedService.getLegalCaseWithDocuments(caseId);

    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/documents/statistics')
  @ApiOperation({ summary: 'Get document statistics for a legal case' })
  @ApiParam({ name: 'id', description: 'Legal case UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document statistics retrieved successfully',
  })
  async getCaseDocumentStatistics(@Param('id') caseId: string) {
    const statistics = await this.legalCaseEnhancedService.getCaseDocumentStatistics(caseId);

    return {
      success: true,
      data: statistics,
    };
  }

  @Post(':id/documents/bulk-upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 10, { fileFilter: fileTypeFilter }))
  @ApiOperation({ summary: 'Bulk upload documents to existing case' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Legal case UUID' })
  @ApiBody({
    description: 'Bulk upload documents to existing case',
    schema: {
      type: 'object',
      properties: {
        documents: {
          type: 'array',
          description: 'Document metadata',
          items: {
            type: 'object',
            properties: {
              documentName: { type: 'string' },
              caseDocumentType: { type: 'string' },
              hearingDate: { type: 'string', format: 'date' },
              documentDate: { type: 'string', format: 'date' },
              confidentialFlag: { type: 'boolean' },
              remarks: { type: 'string' },
            },
            required: ['documentName', 'caseDocumentType'],
          },
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Document files to upload',
        },
      },
      required: ['documents'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Documents uploaded successfully',
  })
  async bulkUploadDocuments(
    @Param('id') caseId: string,
    @Body('documents', new ParseArrayPipe({ items: Object })) documents: any[],
    @UploadedFiles() files: any[],
    @Request() req: any,
  ) {
    const uploadedBy = req.user?.username || 'system';

    const result = await this.legalCaseEnhancedService.bulkUploadDocuments(
      caseId,
      documents,
      files || [],
      uploadedBy,
    );

    return {
      success: true,
      message: `Bulk upload completed. Success: ${result.success.length}, Failed: ${result.failed.length}`,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete Legal Case with Documents',
    description: 'Deletes a legal case and all its associated documents',
  })
  @ApiParam({
    name: 'id',
    description: 'Legal case ID',
    example: 'uuid-case-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Legal case and documents deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            caseId: { type: 'string' },
            documentsDeleted: { type: 'number' },
            storageCleanup: {
              type: 'object',
              properties: {
                localFilesDeleted: { type: 'number' },
                awsFilesDeleted: { type: 'number' },
                errors: { type: 'array', items: { type: 'string' } },
              },
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
  async deleteLegalCaseWithDocuments(@Param('id') caseId: string, @Request() req: any) {
    const deletedBy = req.user?.username || 'system';

    const result = await this.legalCaseEnhancedService.deleteLegalCaseWithDocuments(
      caseId,
      deletedBy,
    );

    return {
      success: true,
      message: `Legal case and ${result.documentsDeleted} documents deleted successfully`,
      data: result,
    };
  }
}
