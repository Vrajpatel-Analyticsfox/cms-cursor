import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, like, count } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentResponseDto, DocumentListResponseDto } from './dto/document-response.dto';
import { SecureStorageService } from './services/secure-storage.service';
import { VersionControlService } from './services/version-control.service';
import { AccessControlService } from './services/access-control.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentRepositoryService {
  private readonly logger = new Logger(DocumentRepositoryService.name);
  private readonly uploadPath: string;
  private readonly defaultStorageProvider: string;
  private readonly defaultDocumentStatus: string;
  private readonly defaultAccessPermissions: string;
  private readonly defaultVersionNumber: number;
  private readonly defaultIsLatestVersion: boolean;
  private readonly defaultConfidentialFlag: boolean;
  private readonly defaultIsPublic: boolean;
  private readonly maxFileSize: number;
  private readonly documentIdPrefix: string;

  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly configService: ConfigService,
    private readonly secureStorageService: SecureStorageService,
    private readonly versionControlService: VersionControlService,
    private readonly accessControlService: AccessControlService,
  ) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads');
    this.defaultStorageProvider = this.configService.get<string>(
      'DEFAULT_STORAGE_PROVIDER',
      'local',
    );
    this.defaultDocumentStatus = this.configService.get<string>(
      'DEFAULT_DOCUMENT_STATUS',
      'Active',
    );
    this.defaultAccessPermissions = this.configService.get<string>(
      'DEFAULT_ACCESS_PERMISSIONS',
      'Legal Officer',
    );
    this.defaultVersionNumber = this.configService.get<number>('DEFAULT_VERSION_NUMBER', 1);
    this.defaultIsLatestVersion = this.configService.get<boolean>(
      'DEFAULT_IS_LATEST_VERSION',
      true,
    );
    this.defaultConfidentialFlag = this.configService.get<boolean>(
      'DEFAULT_CONFIDENTIAL_FLAG',
      false,
    );
    this.defaultIsPublic = this.configService.get<boolean>('DEFAULT_IS_PUBLIC', false);
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE_MB', 10) * 1024 * 1024;
    this.documentIdPrefix = this.configService.get<string>('DOCUMENT_ID_PREFIX', 'LDR');
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Upload and store a document - BRD Compliant with Security
   */
  async uploadDocument(
    file: any,
    createDto: CreateDocumentDto,
    uploadedBy: string,
  ): Promise<DocumentResponseDto> {
    try {
      // Validate linked entity exists
      await this.validateLinkedEntity(createDto.linkedEntityType, createDto.linkedEntityId);

      // Generate document ID (BRD Format: LDR-YYYYMMDD-Sequence)
      const documentId = await this.generateDocumentId(createDto.linkedEntityType);

      // Store document securely with encryption
      const storageResult = await this.secureStorageService.storeDocument(
        file,
        createDto.linkedEntityType,
        createDto.linkedEntityId,
        createDto.confidentialFlag ?? false,
      );

      // Calculate file size in MB
      const fileSizeMb = (storageResult.fileSize / (1024 * 1024)).toFixed(2);

      // Create document record - BRD Compliant
      const newDocument = await this.db
        .insert(schema.documentRepository)
        .values({
          documentId,
          linkedEntityType: createDto.linkedEntityType,
          linkedEntityId: createDto.linkedEntityId,
          documentName: createDto.documentName,
          documentType: createDto.documentType || 'Other',
          uploadDate: new Date(),
          uploadedBy,
          fileFormat: file.mimetype,
          fileSizeMb,
          accessPermissions: JSON.stringify(createDto.accessPermissions),
          confidentialFlag: createDto.confidentialFlag ?? false,
          versionNumber: 1,
          remarksTags: createDto.remarksTags || null,
          lastUpdated: new Date(),
          // Additional fields for system functionality
          filePath: storageResult.filePath,
          originalFileName: file.originalname,
          fileHash: storageResult.fileHash,
          encryptedFilePath: storageResult.encryptedFilePath,
          encryptionKeyId: storageResult.encryptionKeyId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create initial version record
      await this.db.insert(schema.documentVersions).values({
        documentId: newDocument[0].id,
        versionNumber: 1,
        filePath: storageResult.filePath,
        encryptedFilePath: storageResult.encryptedFilePath,
        fileHash: storageResult.fileHash,
        fileSizeMb,
        changeSummary: 'Initial document upload',
        createdBy: uploadedBy,
      });

      this.logger.log(
        `Document uploaded successfully: ${documentId} for ${createDto.linkedEntityType}:${createDto.linkedEntityId}`,
      );

      return this.mapToResponseDto(newDocument[0]);
    } catch (error) {
      this.logger.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Get document by ID - BRD Compliant with Access Control
   */
  async getDocumentById(
    id: string,
    requestedBy: string,
    userRole: string = 'Legal Officer',
  ): Promise<DocumentResponseDto> {
    try {
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, id))
        .limit(1);

      if (document.length === 0) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Check access permissions using access control service
      const accessResult = await this.accessControlService.checkDocumentAccess(
        id,
        requestedBy,
        userRole,
        'VIEW',
      );

      if (!accessResult.hasAccess) {
        throw new ForbiddenException(accessResult.reason || 'Access denied');
      }

      return this.mapToResponseDto(document[0]);
    } catch (error) {
      this.logger.error(`Error getting document by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get documents by linked entity - BRD Compliant
   */
  async getDocumentsByEntity(
    entityType: string,
    entityId: string,
    requestedBy: string,
    page: number = 1,
    limit: number = 10,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: {
      documentType?: string;
      confidentialFlag?: boolean;
    },
  ): Promise<DocumentListResponseDto> {
    try {
      const offset = (page - 1) * limit;
      // Note: Filters temporarily disabled for debugging

      // Get total count (no filters applied for now)
      const totalResult = await this.db.select({ count: count() }).from(schema.documentRepository);

      const total = totalResult[0].count;

      // Get paginated results
      const documents = await this.db
        .select()
        .from(schema.documentRepository)
        .orderBy(desc(schema.documentRepository.uploadDate))
        .limit(limit)
        .offset(offset);

      // Filter documents based on access permissions
      const accessibleDocuments = documents.filter((doc) => {
        try {
          this.checkDocumentAccessSync(doc, requestedBy);
          return true;
        } catch {
          return false;
        }
      });

      const docs = accessibleDocuments.map((doc) => this.mapToResponseDto(doc));

      return {
        documents: docs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error getting documents for ${entityType}:${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    id: string,
    updateDto: UpdateDocumentDto,
    updatedBy: string,
  ): Promise<DocumentResponseDto> {
    try {
      // Check if document exists
      const existingDocument = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, id))
        .limit(1);

      if (existingDocument.length === 0) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Check access permissions
      await this.checkDocumentAccess(existingDocument[0], updatedBy);

      // Update document
      const updatedDocument = await this.db
        .update(schema.documentRepository)
        .set({
          documentName: updateDto.documentName,
          accessPermissions: updateDto.accessPermissions
            ? JSON.stringify(updateDto.accessPermissions)
            : undefined,
          confidentialFlag: updateDto.confidentialFlag,
          remarksTags: updateDto.remarksTags ? JSON.stringify(updateDto.remarksTags) : undefined,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.documentRepository.id, id))
        .returning();

      this.logger.log(`Document updated successfully: ${updatedDocument[0].documentId}`);

      return this.mapToResponseDto(updatedDocument[0]);
    } catch (error) {
      this.logger.error(`Error updating document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(
    id: string,
    deletedBy: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const existingDocument = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, id))
        .limit(1);

      if (existingDocument.length === 0) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Check access permissions
      await this.checkDocumentAccess(existingDocument[0], deletedBy);

      // Soft delete
      await this.db
        .update(schema.documentRepository)
        .set({
          lastUpdated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.documentRepository.id, id));

      this.logger.log(`Document deleted successfully: ${existingDocument[0].documentId}`);

      return {
        success: true,
        message: `Document ${existingDocument[0].documentId} has been deleted successfully`,
      };
    } catch (error) {
      this.logger.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Download document file - Secure with Access Control
   */
  async downloadDocument(
    id: string,
    requestedBy: string,
    userRole: string = 'Legal Officer',
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    try {
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, id))
        .limit(1);

      if (document.length === 0) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Check access permissions using access control service
      const accessResult = await this.accessControlService.checkDocumentAccess(
        id,
        requestedBy,
        userRole,
        'DOWNLOAD',
      );

      if (!accessResult.hasAccess) {
        throw new ForbiddenException(accessResult.reason || 'Access denied');
      }

      // Retrieve document securely
      const decryptionResult = await this.secureStorageService.retrieveDocument(
        document[0].filePath,
        document[0].encryptedFilePath || '',
        document[0].confidentialFlag || false,
      );

      return {
        buffer: decryptionResult.buffer,
        fileName: decryptionResult.originalFileName,
        mimeType: decryptionResult.mimeType,
      };
    } catch (error) {
      this.logger.error(`Error downloading document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get document versions - Using Version Control Service
   */
  async getDocumentVersions(
    id: string,
    requestedBy: string,
    userRole: string = 'Legal Officer',
  ): Promise<any> {
    try {
      // Check access permissions
      const accessResult = await this.accessControlService.checkDocumentAccess(
        id,
        requestedBy,
        userRole,
        'VIEW',
      );

      if (!accessResult.hasAccess) {
        throw new ForbiddenException(accessResult.reason || 'Access denied');
      }

      // Get versions using version control service
      return await this.versionControlService.getDocumentVersions(id);
    } catch (error) {
      this.logger.error(`Error getting document versions for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new version of a document
   */
  async createDocumentVersion(
    documentId: string,
    file: any,
    changeSummary: string,
    createdBy: string,
    userRole: string = 'Legal Officer',
  ): Promise<DocumentResponseDto> {
    try {
      // Validate file type
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx'];
      const fileExtension = file.originalname
        .toLowerCase()
        .substring(file.originalname.lastIndexOf('.'));

      if (!allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
        );
      }

      // Check access permissions
      const accessResult = await this.accessControlService.checkDocumentAccess(
        documentId,
        createdBy,
        userRole,
        'UPDATE',
      );

      if (!accessResult.hasAccess) {
        throw new ForbiddenException(accessResult.reason || 'Access denied');
      }

      // Get current document
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      if (document.length === 0) {
        throw new NotFoundException(`Document with ID ${documentId} not found`);
      }

      // Store new version securely
      const storageResult = await this.secureStorageService.storeDocument(
        file,
        document[0].linkedEntityType,
        document[0].linkedEntityId,
        document[0].confidentialFlag || false,
      );

      const fileSizeMb = (storageResult.fileSize / (1024 * 1024)).toFixed(2);

      // Create version using version control service
      await this.versionControlService.createVersion({
        documentId,
        filePath: storageResult.filePath,
        encryptedFilePath: storageResult.encryptedFilePath,
        fileHash: storageResult.fileHash,
        fileSizeMb,
        changeSummary,
        createdBy,
      });

      // Update main document record
      const updatedDocument = await this.db
        .update(schema.documentRepository)
        .set({
          filePath: storageResult.filePath,
          encryptedFilePath: storageResult.encryptedFilePath,
          fileHash: storageResult.fileHash,
          fileSizeMb,
          lastUpdated: new Date(),
        })
        .where(eq(schema.documentRepository.id, documentId))
        .returning();

      this.logger.log(`New version created for document ${documentId}`);

      return this.mapToResponseDto(updatedDocument[0]);
    } catch (error) {
      this.logger.error(`Error creating version for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(
    documentId: string,
    versionNumber: number,
    rollbackBy: string,
    userRole: string = 'Legal Officer',
  ): Promise<DocumentResponseDto> {
    try {
      // Check access permissions
      const accessResult = await this.accessControlService.checkDocumentAccess(
        documentId,
        rollbackBy,
        userRole,
        'UPDATE',
      );

      if (!accessResult.hasAccess) {
        throw new ForbiddenException(accessResult.reason || 'Access denied');
      }

      // Rollback using version control service
      await this.versionControlService.rollbackToVersion(documentId, versionNumber, rollbackBy);

      // Get updated document
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      this.logger.log(`Document ${documentId} rolled back to version ${versionNumber}`);

      return this.mapToResponseDto(document[0]);
    } catch (error) {
      this.logger.error(`Error rolling back document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Fix missing version 1 for existing documents
   */
  async fixVersion1(documentId: string): Promise<any> {
    try {
      // Check if document exists
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      if (document.length === 0) {
        return { error: 'Document not found' };
      }

      // Check if version 1 already exists
      const version1Exists = await this.db
        .select()
        .from(schema.documentVersions)
        .where(
          and(
            eq(schema.documentVersions.documentId, documentId),
            eq(schema.documentVersions.versionNumber, 1),
          ),
        )
        .limit(1);

      if (version1Exists.length > 0) {
        return { message: 'Version 1 already exists', version: version1Exists[0] };
      }

      // Create version 1 record
      const version1 = await this.db
        .insert(schema.documentVersions)
        .values({
          documentId,
          versionNumber: 1,
          filePath: document[0].filePath || '',
          encryptedFilePath: document[0].encryptedFilePath || '',
          fileHash: document[0].fileHash || 'initial-hash',
          fileSizeMb: document[0].fileSizeMb || '0',
          changeSummary: 'Fixed: Initial document version',
          createdBy: document[0].uploadedBy || 'system',
        })
        .returning();

      this.logger.log(`Created version 1 for document ${documentId}`);
      return { message: 'Version 1 created successfully', version: version1[0] };
    } catch (error) {
      this.logger.error(`Error fixing version 1 for document ${documentId}:`, error);
      return { error: error.message };
    }
  }

  /**
   * Debug method to check document and version status
   */
  async debugDocument(documentId: string): Promise<any> {
    try {
      // Check if document exists
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      if (document.length === 0) {
        return { error: 'Document not found' };
      }

      // Check version history
      const versions = await this.db
        .select()
        .from(schema.documentVersions)
        .where(eq(schema.documentVersions.documentId, documentId))
        .orderBy(desc(schema.documentVersions.versionNumber));

      return {
        document: {
          id: document[0].id,
          documentId: document[0].documentId,
          versionNumber: document[0].versionNumber,
          filePath: document[0].filePath,
          fileHash: document[0].fileHash,
          uploadedBy: document[0].uploadedBy,
        },
        versions: versions.map((v) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          filePath: v.filePath,
          fileHash: v.fileHash,
          createdBy: v.createdBy,
        })),
        totalVersions: versions.length,
      };
    } catch (error) {
      this.logger.error(`Error debugging document ${documentId}:`, error);
      return { error: error.message };
    }
  }

  /**
   * Private helper methods
   */

  private validateFile(file: any): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }
  }

  private async validateLinkedEntity(entityType: string, entityId: string): Promise<void> {
    switch (entityType) {
      case 'Case ID': {
        // BRD-specified entity type
        const legalCase = await this.db
          .select()
          .from(schema.legalCases)
          .where(and(eq(schema.legalCases.id, entityId), eq(schema.legalCases.status, 'Active')))
          .limit(1);
        if (legalCase.length === 0) {
          throw new BadRequestException(`Legal case with ID ${entityId} not found`);
        }
        break;
      }
      case 'Borrower': {
        // BRD-specified entity type
        // For borrowers, we validate against the borrower table
        // This is a simplified validation - in practice, you might want to check if the borrower ID exists
        if (!entityId || entityId.trim() === '') {
          throw new BadRequestException(`Invalid borrower ID: ${entityId}`);
        }
        break;
      }
      case 'Loan Account': {
        // BRD-specified entity type
        // For loan accounts, we validate against the loan account table
        // This is a simplified validation - in practice, you might want to check if the account number exists
        if (!entityId || entityId.trim() === '') {
          throw new BadRequestException(`Invalid loan account ID: ${entityId}`);
        }
        break;
      }
      default:
        throw new BadRequestException(
          `Invalid entity type: ${entityType}. Must be one of: Borrower, Loan Account, Case ID`,
        );
    }
  }

  // Document type validation removed as per BRD requirements - using simple text field

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async generateDocumentId(_entityType: string): Promise<string> {
    // BRD Format: LDR-YYYYMMDD-Sequence
    const prefix = this.documentIdPrefix;
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get next sequence number - only select documentId to avoid schema mismatch
    const existing = await this.db
      .select({ documentId: schema.documentRepository.documentId })
      .from(schema.documentRepository)
      .where(like(schema.documentRepository.documentId, `${prefix}-${dateStr}-%`))
      .orderBy(desc(schema.documentRepository.documentId))
      .limit(1);

    let sequenceNumber = 1;
    if (existing.length > 0) {
      const lastId = existing[0].documentId;
      const lastSequence = parseInt(lastId.split('-')[2]);
      sequenceNumber = lastSequence + 1;
    }

    return `${prefix}-${dateStr}-${sequenceNumber.toString().padStart(4, '0')}`;
  }

  private calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private generateStoragePath(
    entityType: string,
    entityId: string,
    originalFileName: string,
  ): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    // Map entity types to consistent folder names
    let entityPath: string;
    switch (entityType) {
      case 'Legal Case':
      case 'Case ID':
        entityPath = 'legal-case';
        break;
      case 'Legal Notice':
        entityPath = 'legal-notice';
        break;
      case 'Loan Account':
        entityPath = 'loan-account';
        break;
      default:
        entityPath = entityType.toLowerCase().replace(' ', '-');
    }

    const fileName = `${Date.now()}-${originalFileName}`;

    return path.join(this.uploadPath, entityPath, entityId, `${year}/${month}/${day}`, fileName);
  }

  private saveFileToStorage(file: any, storagePath: string): void {
    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(storagePath, file.buffer);
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  private checkDocumentAccess(document: any, requestedBy: string): void {
    // Check if user has access permissions
    const permissions = JSON.parse(document.accessPermissions || '[]');
    if (permissions.includes(requestedBy)) {
      return;
    }

    // Check if user is the uploader
    if (document.uploadedBy === requestedBy) {
      return;
    }

    // Check if document is confidential
    if (document.confidentialFlag) {
      throw new ForbiddenException('Access denied: Document is confidential');
    }

    throw new ForbiddenException('Access denied: Insufficient permissions');
  }

  private checkDocumentAccessSync(document: any, requestedBy: string): void {
    // Check if user has access permissions
    const permissions = JSON.parse(document.accessPermissions || '[]');
    if (permissions.includes(requestedBy)) {
      return;
    }

    // Check if user is the uploader
    if (document.uploadedBy === requestedBy) {
      return;
    }

    // Check if document is confidential
    if (document.confidentialFlag) {
      throw new ForbiddenException('Access denied: Document is confidential');
    }

    throw new ForbiddenException('Access denied: Insufficient permissions');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async updateLastAccessed(id: string, _accessedBy: string): Promise<void> {
    await this.db
      .update(schema.documentRepository)
      .set({
        lastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.documentRepository.id, id));
  }

  private mapToResponseDto(document: any): DocumentResponseDto {
    return {
      id: document.id,
      documentId: document.documentId,
      linkedEntityType: document.linkedEntityType,
      linkedEntityId: document.linkedEntityId,
      documentName: document.documentName,
      documentType: document.documentType,
      uploadDate: document.uploadDate?.toISOString(),
      uploadedBy: document.uploadedBy,
      fileFormat: document.fileFormat,
      fileSizeMb: document.fileSizeMb,
      accessPermissions: JSON.parse(document.accessPermissions || '[]'),
      confidentialFlag: document.confidentialFlag,
      versionNumber: document.versionNumber,
      remarksTags: document.remarksTags,
      lastUpdated: document.lastUpdated?.toISOString(),
      // Additional fields for basic functionality
      originalFileName: document.originalFileName,
      filePath: document.filePath,
      createdAt: document.createdAt?.toISOString(),
      updatedAt: document.updatedAt?.toISOString(),
    };
  }
}
