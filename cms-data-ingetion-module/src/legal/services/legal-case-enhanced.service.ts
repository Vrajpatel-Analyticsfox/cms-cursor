import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, like, count, sql } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { LegalCaseService } from './legal-case.service';
import { LegalCaseDocumentService } from './legal-case-document.service';
import { HybridStorageService } from './hybrid-storage.service';
import {
  CreateLegalCaseWithDocumentsDto,
  DocumentUploadDto,
} from '../dto/create-legal-case-with-documents.dto';
import { UpdateLegalCaseWithDocumentsDto } from '../dto/update-legal-case-with-documents.dto';
import { LegalCaseResponseDto } from '../dto/legal-case-response.dto';
import { DocumentResponseDto } from '../dto/document-response.dto';

@Injectable()
export class LegalCaseEnhancedService {
  private readonly logger = new Logger(LegalCaseEnhancedService.name);

  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly legalCaseService: LegalCaseService,
    private readonly legalCaseDocumentService: LegalCaseDocumentService,
    private readonly hybridStorageService: HybridStorageService,
  ) {}

  /**
   * Create legal case with documents
   */
  async createLegalCaseWithDocuments(
    createDto: CreateLegalCaseWithDocumentsDto,
    files: any[],
    createdBy: string,
  ): Promise<{
    case: LegalCaseResponseDto;
    documents: DocumentResponseDto[];
    summary: {
      totalDocuments: number;
      documentsByType: Record<string, number>;
    };
  }> {
    try {
      this.logger.log(
        `Creating legal case with documents for account: ${createDto.loanAccountNumber}`,
      );

      console.log('=== DEBUGGING DOCUMENT UPLOAD ===');
      console.log('createDto.documents:', createDto.documents);
      console.log('createDto.documents type:', typeof createDto.documents);
      console.log('files received:', files);
      console.log('files length:', files?.length);
      console.log('createDto keys:', Object.keys(createDto));

      // Parse documents if it's a string (multipart form data issue)
      let documents = createDto.documents;
      if (typeof documents === 'string') {
        try {
          documents = JSON.parse(documents);
          console.log('Parsed documents:', documents);
        } catch (error) {
          console.error('Error parsing documents JSON:', error);
          throw new BadRequestException('Invalid documents JSON format');
        }
      }

      // Handle case where documents might be undefined or null
      if (!documents) {
        documents = [];
        console.log('Documents was undefined/null, setting to empty array');
      }

      console.log('Final documents:', documents);
      console.log('Final documents length:', documents?.length);
      console.log('=== END DEBUGGING ===');

      // Validate files match documents
      if (documents && documents.length > 0) {
        if (!files || files.length !== documents.length) {
          throw new BadRequestException('Number of files must match number of documents specified');
        }
      } else if (files && files.length > 0) {
        // If files are provided but no documents metadata, that's an error
        throw new BadRequestException('Document metadata must be provided when uploading files');
      }

      // Helper function to convert empty strings to null for date fields
      const sanitizeDateField = (value: string | undefined | null): string | null => {
        if (!value || value.trim() === '') {
          return null;
        }
        return value;
      };

      // Create the legal case first
      const caseData = {
        loanAccountNumber: createDto.loanAccountNumber,
        caseType: createDto.caseType,
        courtName: createDto.courtName,
        caseFiledDate: createDto.caseFiledDate,
        lawyerAssignedId: createDto.lawyerAssignedId,
        filingJurisdiction: createDto.filingJurisdiction,
        currentStatus: createDto.currentStatus || 'Filed',
        nextHearingDate: sanitizeDateField(createDto.nextHearingDate),
        lastHearingOutcome: createDto.lastHearingOutcome || null,
        recoveryActionLinked: createDto.recoveryActionLinked || null,
        caseRemarks: createDto.caseRemarks || null,
        caseClosureDate: sanitizeDateField(createDto.caseClosureDate),
        outcomeSummary: createDto.outcomeSummary || null,
      };

      const createdCase = await this.legalCaseService.createLegalCase(caseData, createdBy);

      // Upload documents if provided
      const uploadedDocuments: DocumentResponseDto[] = [];
      if (documents && documents.length > 0) {
        for (let i = 0; i < documents.length; i++) {
          const documentData = documents[i];
          const file = files[i];

          try {
            const uploadedDocument = await this.legalCaseDocumentService.uploadCaseDocument(
              createdCase.id,
              file,
              documentData,
              createdBy,
            );
            uploadedDocuments.push(uploadedDocument);
          } catch (error) {
            this.logger.error(`Failed to upload document ${i + 1}:`, error);
            // Continue with other documents, but log the error
          }
        }
      }

      // Get document summary
      const documentSummary = await this.getDocumentSummary(createdCase.id);

      this.logger.log(`Legal case created successfully with ${uploadedDocuments.length} documents`);

      return {
        case: createdCase,
        documents: uploadedDocuments,
        summary: documentSummary,
      };
    } catch (error) {
      this.logger.error('Error creating legal case with documents:', error);
      throw error;
    }
  }

  /**
   * Update legal case with documents
   */
  async updateLegalCaseWithDocuments(
    caseId: string,
    updateDto: UpdateLegalCaseWithDocumentsDto,
    files: any[],
    updatedBy: string,
  ): Promise<{
    case: LegalCaseResponseDto;
    documentsAdded: DocumentResponseDto[];
    documentsRemoved: string[];
    summary: {
      totalDocuments: number;
      documentsByType: Record<string, number>;
    };
  }> {
    try {
      this.logger.log(`Updating legal case ${caseId} with documents`);

      // Validate case exists
      const caseExists = await this.validateCaseExists(caseId);
      if (!caseExists) {
        throw new NotFoundException('Legal case not found');
      }

      // Parse documentsToAdd if it's a string (multipart form data issue)
      let documentsToAdd = updateDto.documentsToAdd;
      if (typeof documentsToAdd === 'string') {
        try {
          documentsToAdd = JSON.parse(documentsToAdd);
        } catch (error) {
          console.error('Error parsing documentsToAdd JSON:', error);
          throw new BadRequestException('Invalid documentsToAdd JSON format');
        }
      }

      // Parse documentsToRemove if it's a string (multipart form data issue)
      let documentsToRemove = updateDto.documentsToRemove;
      if (typeof documentsToRemove === 'string') {
        try {
          documentsToRemove = JSON.parse(documentsToRemove);
        } catch (error) {
          console.error('Error parsing documentsToRemove JSON:', error);
          throw new BadRequestException('Invalid documentsToRemove JSON format');
        }
      }

      // Helper function to convert empty strings to null for date fields
      const sanitizeDateField = (value: string | undefined | null): string | null => {
        if (!value || value.trim() === '') {
          return null;
        }
        return value;
      };

      // Update the legal case
      const caseData: any = {
        loanAccountNumber: updateDto.loanAccountNumber,
        caseType: updateDto.caseType,
        courtName: updateDto.courtName,
        caseFiledDate: updateDto.caseFiledDate,
        lawyerAssignedId: updateDto.lawyerAssignedId,
        filingJurisdiction: updateDto.filingJurisdiction,
        currentStatus: updateDto.currentStatus,
        nextHearingDate: updateDto.nextHearingDate,
        lastHearingOutcome: updateDto.lastHearingOutcome,
        recoveryActionLinked: updateDto.recoveryActionLinked,
        caseRemarks: updateDto.caseRemarks,
        caseClosureDate: updateDto.caseClosureDate,
        outcomeSummary: updateDto.outcomeSummary,
      };

      // Sanitize date fields
      if (updateDto.nextHearingDate !== undefined) {
        caseData.nextHearingDate = sanitizeDateField(updateDto.nextHearingDate);
      }
      if (updateDto.caseClosureDate !== undefined) {
        caseData.caseClosureDate = sanitizeDateField(updateDto.caseClosureDate);
      }

      // Sanitize text fields to null if empty
      if (updateDto.lastHearingOutcome !== undefined) {
        caseData.lastHearingOutcome = updateDto.lastHearingOutcome || null;
      }
      if (updateDto.recoveryActionLinked !== undefined) {
        caseData.recoveryActionLinked = updateDto.recoveryActionLinked || null;
      }
      if (updateDto.caseRemarks !== undefined) {
        caseData.caseRemarks = updateDto.caseRemarks || null;
      }
      if (updateDto.outcomeSummary !== undefined) {
        caseData.outcomeSummary = updateDto.outcomeSummary || null;
      }

      // Remove undefined values
      const cleanCaseData = Object.fromEntries(
        Object.entries(caseData).filter(([_, value]) => value !== undefined),
      );

      const updatedCase = await this.legalCaseService.updateLegalCase(
        caseId,
        cleanCaseData,
        updatedBy,
      );

      // Handle document operations
      const documentsAdded: DocumentResponseDto[] = [];
      const documentsRemoved: string[] = [];

      // Add new documents
      if (documentsToAdd && documentsToAdd.length > 0) {
        if (!files || files.length !== documentsToAdd.length) {
          throw new BadRequestException('Number of files must match number of documents to add');
        }

        for (let i = 0; i < documentsToAdd.length; i++) {
          const documentData = documentsToAdd[i];
          const file = files[i];

          try {
            const uploadedDocument = await this.legalCaseDocumentService.uploadCaseDocument(
              caseId,
              file,
              documentData,
              updatedBy,
            );
            documentsAdded.push(uploadedDocument);
          } catch (error) {
            this.logger.error(`Failed to upload document ${i + 1}:`, error);
            // Continue with other documents
          }
        }
      }

      // Remove documents
      if (documentsToRemove && documentsToRemove.length > 0) {
        for (const documentId of documentsToRemove) {
          try {
            await this.legalCaseDocumentService.deleteCaseDocument(caseId, documentId, updatedBy);
            documentsRemoved.push(documentId);
          } catch (error) {
            this.logger.error(`Failed to remove document ${documentId}:`, error);
            // Continue with other documents
          }
        }
      }

      // Get updated document summary
      const documentSummary = await this.getDocumentSummary(caseId);

      this.logger.log(
        `Legal case updated successfully. Added: ${documentsAdded.length}, Removed: ${documentsRemoved.length}`,
      );

      return {
        case: updatedCase,
        documentsAdded,
        documentsRemoved,
        summary: documentSummary,
      };
    } catch (error) {
      this.logger.error('Error updating legal case with documents:', error);
      throw error;
    }
  }

  /**
   * Get legal case with documents summary
   */
  async getLegalCaseWithDocuments(caseId: string): Promise<{
    case: LegalCaseResponseDto;
    documents: DocumentResponseDto[];
    summary: {
      totalDocuments: number;
      documentsByType: Record<string, number>;
      recentDocuments: DocumentResponseDto[];
    };
  }> {
    try {
      // Get case details
      const caseDetails = await this.legalCaseService.getLegalCaseById(caseId);

      // Get all documents for the case
      const documentsResult = await this.legalCaseDocumentService.getCaseDocuments(
        caseId,
        1,
        100, // Get all documents
      );

      // Get recent documents (last 5)
      const recentDocuments = documentsResult.documents.slice(0, 5);

      // Get document summary
      const summary = await this.getDocumentSummary(caseId);

      return {
        case: caseDetails,
        documents: documentsResult.documents,
        summary: {
          ...summary,
          recentDocuments,
        },
      };
    } catch (error) {
      this.logger.error('Error getting legal case with documents:', error);
      throw error;
    }
  }

  /**
   * Get document summary for a case
   */
  private async getDocumentSummary(caseId: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
  }> {
    try {
      const stats = await this.db
        .select({
          caseDocumentType: schema.documentRepository.caseDocumentType,
          count: count(schema.documentRepository.id),
        })
        .from(schema.documentRepository)
        .where(
          and(
            eq(schema.documentRepository.linkedEntityType, 'Legal Case'),
            eq(schema.documentRepository.linkedEntityId, caseId),
            eq(schema.documentRepository.documentStatusEnum, 'active'),
          ),
        )
        .groupBy(schema.documentRepository.caseDocumentType);

      const totalDocuments = stats.reduce((sum, stat) => sum + stat.count, 0);
      const documentsByType = stats.reduce(
        (acc, stat) => {
          acc[stat.caseDocumentType || 'Unknown'] = stat.count;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalDocuments,
        documentsByType,
      };
    } catch (error) {
      this.logger.error('Error getting document summary:', error);
      return {
        totalDocuments: 0,
        documentsByType: {},
      };
    }
  }

  /**
   * Validate case exists
   */
  private async validateCaseExists(caseId: string): Promise<boolean> {
    const caseExists = await this.db
      .select({ id: schema.legalCases.id })
      .from(schema.legalCases)
      .where(and(eq(schema.legalCases.id, caseId), eq(schema.legalCases.status, 'Active')))
      .limit(1);

    return caseExists.length > 0;
  }

  /**
   * Get case document statistics
   */
  async getCaseDocumentStatistics(caseId: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    documentsByStatus: Record<string, number>;
    totalSize: string;
    averageSize: string;
    lastUploaded: string | null;
  }> {
    return this.legalCaseDocumentService.getCaseDocumentStatistics(caseId);
  }

  /**
   * Bulk upload documents to existing case
   */
  async bulkUploadDocuments(
    caseId: string,
    documents: DocumentUploadDto[],
    files: any[],
    uploadedBy: string,
  ): Promise<{
    success: DocumentResponseDto[];
    failed: Array<{ document: DocumentUploadDto; error: string }>;
  }> {
    try {
      if (!files || files.length !== documents.length) {
        throw new BadRequestException('Number of files must match number of documents');
      }

      const success: DocumentResponseDto[] = [];
      const failed: Array<{ document: DocumentUploadDto; error: string }> = [];

      for (let i = 0; i < documents.length; i++) {
        try {
          const uploadedDocument = await this.legalCaseDocumentService.uploadCaseDocument(
            caseId,
            files[i],
            documents[i],
            uploadedBy,
          );
          success.push(uploadedDocument);
        } catch (error) {
          failed.push({
            document: documents[i],
            error: error.message || 'Unknown error',
          });
        }
      }

      this.logger.log(
        `Bulk upload completed. Success: ${success.length}, Failed: ${failed.length}`,
      );

      return { success, failed };
    } catch (error) {
      this.logger.error('Error in bulk upload documents:', error);
      throw error;
    }
  }

  /**
   * Delete legal case with all associated documents
   */
  async deleteLegalCaseWithDocuments(
    caseId: string,
    deletedBy: string,
  ): Promise<{
    caseId: string;
    documentsDeleted: number;
    storageCleanup: {
      localFilesDeleted: number;
      awsFilesDeleted: number;
      errors: string[];
    };
  }> {
    try {
      this.logger.log(`Deleting legal case ${caseId} with all documents`);

      // Validate case exists
      const caseExists = await this.validateCaseExists(caseId);
      if (!caseExists) {
        throw new NotFoundException('Legal case not found');
      }

      // Get all documents for this case
      const documentsResult = await this.legalCaseDocumentService.getCaseDocuments(
        caseId,
        1,
        1000, // Get all documents
      );

      const documents = documentsResult.documents;
      let documentsDeleted = 0;
      const storageCleanup = {
        localFilesDeleted: 0,
        awsFilesDeleted: 0,
        errors: [] as string[],
      };

      // Delete all documents and their files
      for (const document of documents) {
        try {
          // Delete the document record from database
          await this.legalCaseDocumentService.deleteCaseDocument(caseId, document.id, deletedBy);
          documentsDeleted++;

          // Delete physical files from storage
          try {
            const deleteResult = await this.hybridStorageService.deleteFile(
              document.filePath,
              document.storageProvider,
            );

            if (document.storageProvider === 'local' || document.storageProvider === 'hybrid') {
              storageCleanup.localFilesDeleted++;
            }
            if (document.storageProvider === 'aws-s3' || document.storageProvider === 'hybrid') {
              storageCleanup.awsFilesDeleted++;
            }
          } catch (fileError) {
            this.logger.warn(`Failed to delete file for document ${document.id}:`, fileError);
            storageCleanup.errors.push(`Document ${document.id}: ${fileError.message}`);
          }
        } catch (error) {
          this.logger.error(`Failed to delete document ${document.id}:`, error);
          storageCleanup.errors.push(`Document ${document.id}: ${error.message}`);
        }
      }

      // Delete the legal case itself
      await this.legalCaseService.deleteLegalCase(caseId, deletedBy);

      this.logger.log(
        `Legal case ${caseId} deleted with ${documentsDeleted} documents and storage cleanup completed`,
      );

      return {
        caseId,
        documentsDeleted,
        storageCleanup,
      };
    } catch (error) {
      this.logger.error('Error deleting legal case with documents:', error);
      throw error;
    }
  }
}
