import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface StorageResult {
  filePath: string;
  encryptedFilePath: string;
  fileHash: string;
  encryptionKeyId: string;
  fileSize: number;
}

export interface DecryptionResult {
  buffer: Buffer;
  mimeType: string;
  originalFileName: string;
}

@Injectable()
export class SecureStorageService {
  private readonly logger = new Logger(SecureStorageService.name);
  private readonly uploadPath: string;
  private readonly encryptionKey: string;
  private readonly algorithm: string;
  private readonly maxFileSize: number;
  private readonly allowedFileTypes: string[];

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads');
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '';
    this.algorithm = this.configService.get<string>('ENCRYPTION_ALGORITHM', 'aes-256-gcm');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE_MB', 10) * 1024 * 1024; // Convert MB to bytes
    this.allowedFileTypes = this.configService
      .get<string>(
        'ALLOWED_FILE_TYPES',
        'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      .split(',');

    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    this.ensureUploadDirectory();
  }

  /**
   * Store document with encryption
   */
  async storeDocument(
    file: any,
    entityType: string,
    entityId: string,
    isConfidential: boolean = false,
  ): Promise<StorageResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate file paths
      const storagePath = this.generateStoragePath(entityType, entityId, file.originalname);
      const encryptedPath = this.generateEncryptedPath(storagePath);

      // Ensure directories exist
      this.ensureDirectoryExists(path.dirname(storagePath));
      this.ensureDirectoryExists(path.dirname(encryptedPath));

      // Calculate file hash
      const fileHash = this.calculateFileHash(file.buffer);

      // Store original file (for non-confidential documents)
      if (!isConfidential) {
        fs.writeFileSync(storagePath, file.buffer);
      }

      // Always encrypt and store encrypted version
      const encryptionKeyId = await this.encryptAndStore(file.buffer, encryptedPath);

      const fileSize = file.size;

      this.logger.log(`Document stored securely: ${path.basename(storagePath)}`);

      return {
        filePath: storagePath,
        encryptedFilePath: encryptedPath,
        fileHash,
        encryptionKeyId,
        fileSize,
      };
    } catch (error) {
      this.logger.error('Error storing document:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt document
   */
  async retrieveDocument(
    filePath: string,
    encryptedFilePath: string,
    isConfidential: boolean = false,
  ): Promise<DecryptionResult> {
    try {
      let buffer: Buffer;

      if (isConfidential) {
        // For confidential documents, only use encrypted version
        buffer = await this.decryptFile(encryptedFilePath);
      } else {
        // For non-confidential documents, try original first, fallback to encrypted
        if (fs.existsSync(filePath)) {
          buffer = fs.readFileSync(filePath);
        } else {
          buffer = await this.decryptFile(encryptedFilePath);
        }
      }

      // Determine MIME type and original filename from file path
      const mimeType = this.getMimeTypeFromPath(filePath);
      const originalFileName = path.basename(filePath);

      return {
        buffer,
        mimeType,
        originalFileName,
      };
    } catch (error) {
      this.logger.error('Error retrieving document:', error);
      throw error;
    }
  }

  /**
   * Delete document and its encrypted version
   */
  async deleteDocument(filePath: string, encryptedFilePath: string): Promise<void> {
    try {
      // Delete original file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete encrypted file
      if (fs.existsSync(encryptedFilePath)) {
        fs.unlinkSync(encryptedFilePath);
      }

      this.logger.log(`Document deleted: ${path.basename(filePath)}`);
    } catch (error) {
      this.logger.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Verify file integrity
   */
  async verifyFileIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const buffer = fs.readFileSync(filePath);
      const actualHash = this.calculateFileHash(buffer);

      return actualHash === expectedHash;
    } catch (error) {
      this.logger.error('Error verifying file integrity:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */

  private validateFile(file: any): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`,
      );
    }

    // Check file type
    if (!this.allowedFileTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }
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

    // Map entity types to folder names
    let entityPath: string;
    switch (entityType) {
      case 'Case ID':
        entityPath = 'legal-case';
        break;
      case 'Borrower':
        entityPath = 'borrower';
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

  private generateEncryptedPath(originalPath: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    return path.join(dir, 'encrypted', `${name}.enc${ext}`);
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async encryptAndStore(buffer: Buffer, encryptedPath: string): Promise<string> {
    const salt = this.configService.get<string>('ENCRYPTION_SALT', 'document-encryption-salt');
    const key = crypto.scryptSync(this.encryptionKey, salt, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
    cipher.setAAD(Buffer.from('document-encryption'));

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Store encrypted data with IV and auth tag
    const encryptedData = Buffer.concat([iv, authTag, encrypted]);
    fs.writeFileSync(encryptedPath, encryptedData);

    // Return a key ID (in production, this would be a proper key management system)
    return crypto.createHash('sha256').update(this.encryptionKey).digest('hex').substring(0, 16);
  }

  private async decryptFile(encryptedPath: string): Promise<Buffer> {
    const encryptedData = fs.readFileSync(encryptedPath);

    // Extract IV, auth tag, and encrypted content
    const iv = encryptedData.subarray(0, 16);
    const authTag = encryptedData.subarray(16, 32);
    const encrypted = encryptedData.subarray(32);

    const salt = this.configService.get<string>('ENCRYPTION_SALT', 'document-encryption-salt');
    const key = crypto.scryptSync(this.encryptionKey, salt, 32);
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;
    decipher.setAAD(Buffer.from('document-encryption'));
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  private getMimeTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
