import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, like, count, SQL, sql } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { DocumentRepositoryService } from '../document-repository.service';
import { LegalCaseResponseDto } from '../../dto/legal-case-response.dto';
import { DocumentResponseDto, DocumentListResponseDto } from '../dto/document-response.dto';
import { CreateDocumentDto } from '../dto/create-document.dto';

@Injectable()
export class LegalCaseDocumentService {
  private readonly logger = new Logger(LegalCaseDocumentService.name);

  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly documentRepositoryService: DocumentRepositoryService,
  ) {}

  /**
   * Upload document for a legal case
   */
  async uploadCaseDocument(
    caseId: string,
    file: any,
    documentData: {
      documentName: string;
      documentType: string;
      hearingDate?: string | null;
      documentDate?: string | null;
      confidentialFlag?: boolean;
      remarks?: string | null;
    },
    uploadedBy: string,
  ): Promise<DocumentResponseDto> {
    try {
      // Validate case exists
      const caseExists = await this.validateCaseExists(caseId);
      if (!caseExists) {
        throw new NotFoundException('Legal case not found');
      }

      // Get default document type for case documents
      const documentType = await this.getDefaultDocumentType('Legal Case Document');

      // Create document DTO
      const createDocumentDto: CreateDocumentDto = {
        linkedEntityType: 'Case ID', // BRD-specified entity type
        linkedEntityId: caseId,
        documentName: documentData.documentName,
        documentType: documentData.documentType as
          | 'Legal Notice'
          | 'Court Order'
          | 'Affidavit'
          | 'Case Summary'
          | 'Proof'
          | 'Other',
        confidentialFlag: documentData.confidentialFlag || false,
        remarksTags: documentData.remarks || undefined,
        accessPermissions: ['Lawyer', 'Admin'], // BRD-specified permissions
      };

      // Upload document using existing service
      const uploadedDocument = await this.documentRepositoryService.uploadDocument(
        file,
        createDocumentDto,
        uploadedBy,
      );

      // Log document upload
      this.logger.log(`Document uploaded for case ${caseId}: ${uploadedDocument.documentName}`);

      return uploadedDocument;
    } catch (error) {
      this.logger.error('Error uploading case document:', error);
      throw error;
    }
  }

  /**
   * Get all documents for a legal case
   */
  async getCaseDocuments(
    caseId: string,
    page: number = 1,
    limit: number = 10,
    filters?: {
      documentType?: string;
      confidentialFlag?: boolean;
      hearingDate?: string;
    },
  ): Promise<DocumentListResponseDto> {
    try {
      // Validate case exists
      const caseExists = await this.validateCaseExists(caseId);
      if (!caseExists) {
        throw new NotFoundException('Legal case not found');
      }

      // Get documents using existing service
      return await this.documentRepositoryService.getDocumentsByEntity(
        'Legal Case',
        caseId,
        'system', // requestedBy
        page,
        limit,
        filters,
      );
    } catch (error) {
      this.logger.error('Error getting case documents:', error);
      throw error;
    }
  }

  /**
   * Get case with documents summary
   */
  async getCaseWithDocuments(caseId: string): Promise<{
    case: LegalCaseResponseDto;
    documents: {
      total: number;
      byType: Record<string, number>;
      recent: DocumentResponseDto[];
    };
  }> {
    try {
      // Get case details
      const caseDetails = await this.getCaseDetails(caseId);

      // Get document summary
      const documentSummary = await this.getDocumentSummary(caseId);

      // Get recent documents (last 5)
      const recentDocuments = await this.getRecentDocuments(caseId, 5);

      return {
        case: caseDetails,
        documents: {
          total: documentSummary.total,
          byType: documentSummary.byType,
          recent: recentDocuments,
        },
      };
    } catch (error) {
      this.logger.error('Error getting case with documents:', error);
      throw error;
    }
  }

  /**
   * Delete case document
   */
  async deleteCaseDocument(
    caseId: string,
    documentId: string,
    deletedBy: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate case exists
      const caseExists = await this.validateCaseExists(caseId);
      if (!caseExists) {
        throw new NotFoundException('Legal case not found');
      }

      // Validate document belongs to case
      const documentBelongsToCase = await this.validateDocumentBelongsToCase(documentId, caseId);
      if (!documentBelongsToCase) {
        throw new BadRequestException('Document does not belong to this case');
      }

      // Delete document using existing service
      const result = await this.documentRepositoryService.deleteDocument(documentId, deletedBy);

      this.logger.log(`Document ${documentId} deleted from case ${caseId} by ${deletedBy}`);

      return result;
    } catch (error) {
      this.logger.error('Error deleting case document:', error);
      throw error;
    }
  }

  /**
   * Get document statistics for a case
   */
  async getCaseDocumentStatistics(caseId: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    documentsByStatus: Record<string, number>;
    totalSize: string;
    averageSize: string;
    lastUploaded: string | null;
  }> {
    try {
      const stats = await this.db
        .select({
          totalDocuments: count(schema.documentRepository.id),
          totalSize: sql<string>`SUM(CAST(${schema.documentRepository.fileSizeMb} AS BIGINT))`,
        })
        .from(schema.documentRepository)
        .where(
          and(
            eq(schema.documentRepository.linkedEntityType, 'Case ID'),
            eq(schema.documentRepository.linkedEntityId, caseId),
            eq(schema.documentRepository.confidentialFlag, false),
          ),
        );

      const byType = await this.db
        .select({
          documentType: schema.documentRepository.documentType,
          count: count(schema.documentRepository.id),
        })
        .from(schema.documentRepository)
        .where(
          and(
            eq(schema.documentRepository.linkedEntityType, 'Case ID'),
            eq(schema.documentRepository.linkedEntityId, caseId),
            eq(schema.documentRepository.confidentialFlag, false),
          ),
        )
        .groupBy(schema.documentRepository.documentType);

      const lastUploaded = await this.db
        .select({
          uploadDate: schema.documentRepository.uploadDate,
        })
        .from(schema.documentRepository)
        .where(
          and(
            eq(schema.documentRepository.linkedEntityType, 'Case ID'),
            eq(schema.documentRepository.linkedEntityId, caseId),
            eq(schema.documentRepository.confidentialFlag, false),
          ),
        )
        .orderBy(desc(schema.documentRepository.uploadDate))
        .limit(1);

      const totalSizeBytes = parseInt(stats[0]?.totalSize || '0');
      const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
      const averageSizeMB = stats[0]?.totalDocuments
        ? (totalSizeBytes / (1024 * 1024) / stats[0].totalDocuments).toFixed(2)
        : '0';

      return {
        totalDocuments: stats[0]?.totalDocuments || 0,
        documentsByType: byType.reduce(
          (acc, item) => {
            acc[item.documentType || 'Unknown'] = item.count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        documentsByStatus: { active: stats[0]?.totalDocuments || 0 },
        totalSize: `${totalSizeMB} MB`,
        averageSize: `${averageSizeMB} MB`,
        lastUploaded: lastUploaded[0]?.uploadDate?.toISOString() || null,
      };
    } catch (error) {
      this.logger.error('Error getting case document statistics:', error);
      throw error;
    }
  }

  // Private helper methods
  private async validateCaseExists(caseId: string): Promise<boolean> {
    const caseExists = await this.db
      .select({ id: schema.legalCases.id })
      .from(schema.legalCases)
      .where(and(eq(schema.legalCases.id, caseId), eq(schema.legalCases.status, 'Active')))
      .limit(1);

    return caseExists.length > 0;
  }

  private async validateDocumentBelongsToCase(
    documentId: string,
    caseId: string,
  ): Promise<boolean> {
    const document = await this.db
      .select({ linkedEntityId: schema.documentRepository.linkedEntityId })
      .from(schema.documentRepository)
      .where(
        and(
          eq(schema.documentRepository.id, documentId),
          eq(schema.documentRepository.linkedEntityType, 'Case ID'),
        ),
      )
      .limit(1);

    return document.length > 0 && document[0].linkedEntityId === caseId;
  }

  private async getDefaultDocumentType(category: string) {
    // Return a default document type object since documentTypes table was removed for BRD compliance
    return {
      id: 'default-doc-type',
      docTypeCode: 'LEGAL_CASE_DOC',
      docTypeName: 'Legal Case Document',
      docCategory: 'Other',
      isConfidential: false,
      maxFileSizeMb: 10,
      allowedFormats: 'PDF,DOCX,JPG,PNG',
      description: 'Default document type for legal case documents',
      status: 'Active',
      createdBy: 'system',
    };
  }

  private async getCaseDetails(caseId: string): Promise<LegalCaseResponseDto> {
    // This would call the existing LegalCaseService.getLegalCaseById
    // For now, return a placeholder
    throw new Error('Method not implemented - integrate with LegalCaseService');
  }

  private async getDocumentSummary(caseId: string): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    const total = await this.db
      .select({ count: count() })
      .from(schema.documentRepository)
      .where(
        and(
          eq(schema.documentRepository.linkedEntityType, 'Case ID'),
          eq(schema.documentRepository.linkedEntityId, caseId),
          eq(schema.documentRepository.confidentialFlag, false),
        ),
      );

    const byType = await this.db
      .select({
        documentType: schema.documentRepository.documentType,
        count: count(),
      })
      .from(schema.documentRepository)
      .where(
        and(
          eq(schema.documentRepository.linkedEntityType, 'Case ID'),
          eq(schema.documentRepository.linkedEntityId, caseId),
          eq(schema.documentRepository.confidentialFlag, false),
        ),
      )
      .groupBy(schema.documentRepository.documentType);

    return {
      total: total[0]?.count || 0,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.documentType || 'Unknown'] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  private async getRecentDocuments(caseId: string, limit: number): Promise<DocumentResponseDto[]> {
    const documents = await this.db
      .select()
      .from(schema.documentRepository)
      .where(
        and(
          eq(schema.documentRepository.linkedEntityType, 'Case ID'),
          eq(schema.documentRepository.linkedEntityId, caseId),
          eq(schema.documentRepository.confidentialFlag, false),
        ),
      )
      .orderBy(desc(schema.documentRepository.uploadDate))
      .limit(limit);

    // Convert to response DTOs
    return documents.map((doc) => ({
      id: doc.id,
      documentId: doc.documentId,
      linkedEntityType: doc.linkedEntityType as 'Borrower' | 'Loan Account' | 'Case ID',
      linkedEntityId: doc.linkedEntityId,
      documentName: doc.documentName,
      documentType: doc.documentType as
        | 'Legal Notice'
        | 'Court Order'
        | 'Affidavit'
        | 'Case Summary'
        | 'Proof'
        | 'Other',
      uploadDate: doc.uploadDate?.toISOString() || new Date().toISOString(),
      uploadedBy: doc.uploadedBy,
      fileFormat: doc.fileFormat,
      fileSizeMb: doc.fileSizeMb,
      accessPermissions: JSON.parse(doc.accessPermissions || '[]'),
      confidentialFlag: doc.confidentialFlag || false,
      versionNumber: doc.versionNumber || 1,
      remarksTags: doc.remarksTags || undefined,
      lastUpdated: doc.lastUpdated?.toISOString() || new Date().toISOString(),
      originalFileName: doc.originalFileName,
      filePath: doc.filePath,
      fileHash: doc.fileHash,
      encryptedFilePath: doc.encryptedFilePath,
      encryptionKeyId: doc.encryptionKeyId,
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    }));
  }
}
