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
import { eq, and, desc, asc, like, count, sql, SQL, isNull, or } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentResponseDto, DocumentListResponseDto } from './dto/document-response.dto';
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

  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly configService: ConfigService,
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
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Upload and store a document
   */
  async uploadDocument(
    file: any,
    createDto: CreateDocumentDto,
    uploadedBy: string,
  ): Promise<DocumentResponseDto> {
    try {
      // Validate file
      this.validateFile(file);

      // Validate linked entity exists
      await this.validateLinkedEntity(createDto.linkedEntityType, createDto.linkedEntityId);

      // Validate document type
      const documentType = await this.validateDocumentType(createDto.documentTypeId);

      // Generate document ID (BRD Format: LDR-YYYYMMDD-Sequence)
      const documentId = await this.generateDocumentId(createDto.linkedEntityType);

      // Calculate file hash for integrity
      const fileHash = this.calculateFileHash(file.buffer);

      // Generate storage path
      const storagePath = this.generateStoragePath(
        createDto.linkedEntityType,
        createDto.linkedEntityId,
        file.originalname,
      );

      // Save file to storage
      await this.saveFileToStorage(file, storagePath);

      // Calculate file size in MB
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);

      // Create document record
      const newDocument = await this.db
        .insert(schema.documentRepository)
        .values({
          documentId,
          linkedEntityType: createDto.linkedEntityType,
          linkedEntityId: createDto.linkedEntityId,
          documentName: createDto.documentName,
          documentTypeId: createDto.documentTypeId,
          originalFileName: file.originalname,
          fileFormat: file.mimetype,
          fileSizeBytes: file.size.toString(),
          fileSizeMb,
          filePath: storagePath,
          storageProvider: this.defaultStorageProvider,
          accessPermissions: JSON.stringify(
            createDto.accessPermissions || [this.defaultAccessPermissions],
          ),
          confidentialFlag: createDto.confidentialFlag ?? this.defaultConfidentialFlag,
          isPublic: createDto.isPublic ?? this.defaultIsPublic,
          versionNumber: this.defaultVersionNumber,
          isLatestVersion: this.defaultIsLatestVersion,
          documentStatusEnum: this.defaultDocumentStatus as any,
          documentHash: fileHash,
          mimeType: file.mimetype,
          caseDocumentType: createDto.caseDocumentType as any,
          hearingDate: createDto.hearingDate,
          documentDate: createDto.documentDate,
          uploadedBy,
          remarksTags: createDto.remarksTags ? JSON.stringify(createDto.remarksTags) : null,
          createdBy: uploadedBy,
        })
        .returning();

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
   * Get document by ID
   */
  async getDocumentById(id: string, requestedBy: string): Promise<DocumentResponseDto> {
    try {
      const document = await this.db
        .select({
          id: schema.documentRepository.id,
          documentId: schema.documentRepository.documentId,
          linkedEntityType: schema.documentRepository.linkedEntityType,
          linkedEntityId: schema.documentRepository.linkedEntityId,
          documentName: schema.documentRepository.documentName,
          documentTypeId: schema.documentRepository.documentTypeId,
          originalFileName: schema.documentRepository.originalFileName,
          fileFormat: schema.documentRepository.fileFormat,
          fileSizeBytes: schema.documentRepository.fileSizeBytes,
          fileSizeMb: schema.documentRepository.fileSizeMb,
          filePath: schema.documentRepository.filePath,
          storageProvider: schema.documentRepository.storageProvider,
          accessPermissions: schema.documentRepository.accessPermissions,
          confidentialFlag: schema.documentRepository.confidentialFlag,
          isPublic: schema.documentRepository.isPublic,
          versionNumber: schema.documentRepository.versionNumber,
          parentDocumentId: schema.documentRepository.parentDocumentId,
          isLatestVersion: schema.documentRepository.isLatestVersion,
          documentStatus: schema.documentRepository.documentStatusEnum,
          documentHash: schema.documentRepository.documentHash,
          mimeType: schema.documentRepository.mimeType,
          caseDocumentType: schema.documentRepository.caseDocumentType,
          hearingDate: schema.documentRepository.hearingDate,
          documentDate: schema.documentRepository.documentDate,
          uploadDate: schema.documentRepository.uploadDate,
          uploadedBy: schema.documentRepository.uploadedBy,
          lastAccessedAt: schema.documentRepository.lastAccessedAt,
          lastAccessedBy: schema.documentRepository.lastAccessedBy,
          remarksTags: schema.documentRepository.remarksTags,
          createdAt: schema.documentRepository.createdAt,
          updatedAt: schema.documentRepository.updatedAt,
          createdBy: schema.documentRepository.createdBy,
          updatedBy: schema.documentRepository.updatedBy,
          documentTypeName: schema.documentTypes.docTypeName,
          documentCategory: schema.documentTypes.docCategory,
        })
        .from(schema.documentRepository)
        .leftJoin(
          schema.documentTypes,
          eq(schema.documentRepository.documentTypeId, schema.documentTypes.id),
        )
        .where(eq(schema.documentRepository.id, id))
        .limit(1);

      if (document.length === 0) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Check access permissions
      await this.checkDocumentAccess(document[0], requestedBy);

      // Update last accessed
      await this.updateLastAccessed(id, requestedBy);

      return this.mapToResponseDtoWithType(document[0]);
    } catch (error) {
      this.logger.error(`Error getting document by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get documents by linked entity
   */
  async getDocumentsByEntity(
    entityType: string,
    entityId: string,
    requestedBy: string,
    page: number = 1,
    limit: number = 10,
    filters?: {
      caseDocumentType?: string;
      documentStatus?: string;
      confidentialFlag?: boolean;
    },
  ): Promise<DocumentListResponseDto> {
    try {
      const offset = (page - 1) * limit;
      let whereConditions: SQL[] = [
        eq(
          schema.documentRepository.linkedEntityType,
          entityType as 'Borrower' | 'Loan Account' | 'Case ID',
        ),
        eq(schema.documentRepository.linkedEntityId, entityId),
      ];

      // Apply filters
      if (filters?.caseDocumentType) {
        whereConditions.push(
          eq(schema.documentRepository.caseDocumentType, filters.caseDocumentType as any),
        );
      }
      if (filters?.documentStatus) {
        whereConditions.push(
          eq(schema.documentRepository.documentStatusEnum, filters.documentStatus),
        );
      }
      if (filters?.confidentialFlag !== undefined) {
        whereConditions.push(
          eq(schema.documentRepository.confidentialFlag, filters.confidentialFlag),
        );
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(schema.documentRepository)
        .where(whereClause);

      const total = totalResult[0].count;

      // Get paginated results
      const documents = await this.db
        .select({
          id: schema.documentRepository.id,
          documentId: schema.documentRepository.documentId,
          linkedEntityType: schema.documentRepository.linkedEntityType,
          linkedEntityId: schema.documentRepository.linkedEntityId,
          documentName: schema.documentRepository.documentName,
          documentTypeId: schema.documentRepository.documentTypeId,
          originalFileName: schema.documentRepository.originalFileName,
          fileFormat: schema.documentRepository.fileFormat,
          fileSizeBytes: schema.documentRepository.fileSizeBytes,
          fileSizeMb: schema.documentRepository.fileSizeMb,
          filePath: schema.documentRepository.filePath,
          storageProvider: schema.documentRepository.storageProvider,
          accessPermissions: schema.documentRepository.accessPermissions,
          confidentialFlag: schema.documentRepository.confidentialFlag,
          isPublic: schema.documentRepository.isPublic,
          versionNumber: schema.documentRepository.versionNumber,
          parentDocumentId: schema.documentRepository.parentDocumentId,
          isLatestVersion: schema.documentRepository.isLatestVersion,
          documentStatus: schema.documentRepository.documentStatusEnum,
          documentHash: schema.documentRepository.documentHash,
          mimeType: schema.documentRepository.mimeType,
          caseDocumentType: schema.documentRepository.caseDocumentType,
          hearingDate: schema.documentRepository.hearingDate,
          documentDate: schema.documentRepository.documentDate,
          uploadDate: schema.documentRepository.uploadDate,
          uploadedBy: schema.documentRepository.uploadedBy,
          lastAccessedAt: schema.documentRepository.lastAccessedAt,
          lastAccessedBy: schema.documentRepository.lastAccessedBy,
          remarksTags: schema.documentRepository.remarksTags,
          createdAt: schema.documentRepository.createdAt,
          updatedAt: schema.documentRepository.updatedAt,
          createdBy: schema.documentRepository.createdBy,
          updatedBy: schema.documentRepository.updatedBy,
          documentTypeName: schema.documentTypes.docTypeName,
          documentCategory: schema.documentTypes.docCategory,
        })
        .from(schema.documentRepository)
        .leftJoin(
          schema.documentTypes,
          eq(schema.documentRepository.documentTypeId, schema.documentTypes.id),
        )
        .where(whereClause)
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

      const docs = accessibleDocuments.map((doc) => this.mapToResponseDtoWithType(doc));

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
          isPublic: updateDto.isPublic,
          caseDocumentType: updateDto.caseDocumentType as any,
          hearingDate: updateDto.hearingDate,
          documentDate: updateDto.documentDate,
          remarksTags: updateDto.remarksTags ? JSON.stringify(updateDto.remarksTags) : undefined,
          updatedAt: new Date(),
          updatedBy,
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
          documentStatusEnum: 'Deleted',
          updatedAt: new Date(),
          updatedBy: `${deletedBy}-DELETED`,
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
   * Download document file
   */
  async downloadDocument(
    id: string,
    requestedBy: string,
  ): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    try {
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, id))
        .limit(1);

      if (document.length === 0) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Check access permissions
      await this.checkDocumentAccess(document[0], requestedBy);

      // Check if file exists
      if (!fs.existsSync(document[0].filePath)) {
        throw new NotFoundException(`Document file not found: ${document[0].filePath}`);
      }

      // Update last accessed
      await this.updateLastAccessed(id, requestedBy);

      return {
        filePath: document[0].filePath,
        fileName: document[0].originalFileName,
        mimeType: document[0].mimeType || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Error downloading document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(id: string, requestedBy: string): Promise<DocumentResponseDto[]> {
    try {
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, id))
        .limit(1);

      if (document.length === 0) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Check access permissions
      await this.checkDocumentAccess(document[0], requestedBy);

      // Get all versions
      const versions = await this.db
        .select()
        .from(schema.documentRepository)
        .where(
          or(
            eq(schema.documentRepository.id, id),
            eq(schema.documentRepository.parentDocumentId, id),
          ),
        )
        .orderBy(desc(schema.documentRepository.versionNumber));

      return versions.map((doc) => this.mapToResponseDto(doc));
    } catch (error) {
      this.logger.error(`Error getting document versions for ${id}:`, error);
      throw error;
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
      case 'Legal Case':
        const legalCase = await this.db
          .select()
          .from(schema.legalCases)
          .where(and(eq(schema.legalCases.id, entityId), eq(schema.legalCases.status, 'Active')))
          .limit(1);
        if (legalCase.length === 0) {
          throw new BadRequestException(`Legal case with ID ${entityId} not found`);
        }
        break;
      case 'Legal Notice':
        const legalNotice = await this.db
          .select()
          .from(schema.legalNotices)
          .where(eq(schema.legalNotices.id, entityId))
          .limit(1);
        if (legalNotice.length === 0) {
          throw new BadRequestException(`Legal notice with ID ${entityId} not found`);
        }
        break;
      case 'Loan Account':
        // For loan accounts, we now validate against the data ingestion validated table
        // This is a simplified validation - in practice, you might want to check if the account number exists
        if (!entityId || entityId.trim() === '') {
          throw new BadRequestException(`Invalid loan account ID: ${entityId}`);
        }
        break;
      default:
        throw new BadRequestException(`Invalid entity type: ${entityType}`);
    }
  }

  private async validateDocumentType(documentTypeId: string): Promise<any> {
    const documentType = await this.db
      .select()
      .from(schema.documentTypes)
      .where(eq(schema.documentTypes.id, documentTypeId))
      .limit(1);

    if (documentType.length === 0) {
      throw new BadRequestException(`Document type with ID ${documentTypeId} not found`);
    }

    return documentType[0];
  }

  private async generateDocumentId(entityType: string): Promise<string> {
    // BRD Format: LDR-YYYYMMDD-Sequence
    const prefix = 'LDR';
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get next sequence number
    const existing = await this.db
      .select()
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

    const entityPath = entityType.toLowerCase().replace(' ', '-');
    const fileName = `${Date.now()}-${originalFileName}`;

    return path.join(this.uploadPath, entityPath, entityId, `${year}/${month}/${day}`, fileName);
  }

  private async saveFileToStorage(file: any, storagePath: string): Promise<void> {
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

  private async checkDocumentAccess(document: any, requestedBy: string): Promise<void> {
    // Check if document is public
    if (document.isPublic) {
      return;
    }

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
    // Check if document is public
    if (document.isPublic) {
      return;
    }

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

  private async updateLastAccessed(id: string, accessedBy: string): Promise<void> {
    await this.db
      .update(schema.documentRepository)
      .set({
        lastAccessedAt: new Date(),
        lastAccessedBy: accessedBy,
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
      documentTypeId: document.documentTypeId,
      originalFileName: document.originalFileName,
      fileFormat: document.fileFormat,
      fileSizeBytes: document.fileSizeBytes,
      fileSizeMb: document.fileSizeMb,
      filePath: document.filePath,
      storageProvider: document.storageProvider,
      accessPermissions: JSON.parse(document.accessPermissions || '[]'),
      confidentialFlag: document.confidentialFlag,
      isPublic: document.isPublic,
      versionNumber: document.versionNumber,
      parentDocumentId: document.parentDocumentId,
      isLatestVersion: document.isLatestVersion,
      documentStatus: document.documentStatus,
      documentHash: document.documentHash,
      mimeType: document.mimeType,
      caseDocumentType: document.caseDocumentType,
      hearingDate: document.hearingDate,
      documentDate: document.documentDate,
      uploadDate: document.uploadDate?.toISOString(),
      uploadedBy: document.uploadedBy,
      lastAccessedAt: document.lastAccessedAt?.toISOString(),
      lastAccessedBy: document.lastAccessedBy,
      remarksTags: document.remarksTags ? JSON.parse(document.remarksTags) : [],
      createdAt: document.createdAt?.toISOString(),
      updatedAt: document.updatedAt?.toISOString(),
      createdBy: document.createdBy,
      updatedBy: document.updatedBy,
    };
  }

  private mapToResponseDtoWithType(document: any): DocumentResponseDto {
    const response = this.mapToResponseDto(document);
    response.documentTypeName = document.documentTypeName;
    response.documentCategory = document.documentCategory;
    return response;
  }
}
