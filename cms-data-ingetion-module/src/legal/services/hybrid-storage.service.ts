import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsS3StorageService } from './aws-s3-storage.service';
import { EnhancedFileNamingService } from './enhanced-file-naming.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface StorageResult {
  storageProvider: string;
  storageBucket?: string;
  storageKey?: string;
  filePath: string;
}

export interface FileDownloadResult {
  buffer: Buffer;
  contentType: string;
  contentLength: number;
}

@Injectable()
export class HybridStorageService {
  private readonly logger = new Logger(HybridStorageService.name);
  private readonly storageType: 'local' | 'aws-s3' | 'hybrid';
  private readonly uploadPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsS3Service: AwsS3StorageService,
    private readonly enhancedFileNamingService: EnhancedFileNamingService,
  ) {
    this.storageType = (this.configService.get<string>('STORAGE_TYPE') as any) || 'local';
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH') || './uploads';

    // Ensure local upload directory exists
    if (this.storageType === 'local' || this.storageType === 'hybrid') {
      this.ensureUploadDirectory();
    }
  }

  /**
   * Upload file with enhanced naming (sequence numbers for same-day documents)
   */
  async uploadFileWithEnhancedNaming(
    file: any,
    entityType: string,
    entityId: string,
    originalFileName: string,
    caseDocumentType: string,
  ): Promise<StorageResult & { sequenceNumber: number; enhancedFileName: string }> {
    try {
      // Generate enhanced file name with sequence number
      const namingResult = await this.enhancedFileNamingService.generateEnhancedFileName(
        entityType,
        entityId,
        originalFileName,
        caseDocumentType,
      );

      // Upload file with enhanced naming
      const storageResult = await this.uploadFile(
        file,
        entityType,
        entityId,
        namingResult.fileName,
      );

      this.logger.log(
        `File uploaded with enhanced naming: ${namingResult.fileName} (sequence: ${namingResult.sequenceNumber})`,
      );

      return {
        ...storageResult,
        sequenceNumber: namingResult.sequenceNumber,
        enhancedFileName: namingResult.fileName,
      };
    } catch (error) {
      this.logger.error('Error uploading file with enhanced naming:', error);
      throw error;
    }
  }

  /**
   * Upload file using configured storage type
   */
  async uploadFile(
    file: any,
    entityType: string,
    entityId: string,
    fileName: string,
  ): Promise<StorageResult> {
    try {
      switch (this.storageType) {
        case 'local':
          return await this.uploadToLocal(file, entityType, entityId, fileName);

        case 'aws-s3':
          return await this.awsS3Service.uploadFile(file, entityType, entityId, fileName);

        case 'hybrid':
          // Upload to both local and S3 for redundancy
          const localResult = await this.uploadToLocal(file, entityType, entityId, fileName);
          const s3Result = await this.awsS3Service.uploadFile(file, entityType, entityId, fileName);

          this.logger.log(`File uploaded to both local and S3: ${fileName}`);

          // Return S3 result as primary, but keep local as backup
          return {
            ...s3Result,
            filePath: `${s3Result.filePath}|local:${localResult.filePath}`,
          };

        default:
          throw new BadRequestException(`Unsupported storage type: ${this.storageType}`);
      }
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Download file from configured storage
   */
  async downloadFile(
    storageProvider: string,
    storageKey?: string,
    filePath?: string,
  ): Promise<FileDownloadResult> {
    try {
      if (storageProvider === 'aws-s3' && storageKey) {
        return await this.awsS3Service.downloadFile(storageKey);
      } else if (storageProvider === 'local' && filePath) {
        return await this.downloadFromLocal(filePath);
      } else if (storageProvider === 'hybrid') {
        // Try S3 first, fallback to local
        if (storageKey) {
          try {
            return await this.awsS3Service.downloadFile(storageKey);
          } catch (error) {
            this.logger.warn('S3 download failed, trying local fallback:', error);
            if (filePath) {
              return await this.downloadFromLocal(filePath);
            }
            throw error;
          }
        } else if (filePath) {
          return await this.downloadFromLocal(filePath);
        }
      }

      throw new BadRequestException('Invalid storage configuration for download');
    } catch (error) {
      this.logger.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Generate file access URL
   */
  async generateFileUrl(
    storageProvider: string,
    storageKey?: string,
    filePath?: string,
    expiresIn?: number,
  ): Promise<string> {
    try {
      if (storageProvider === 'aws-s3' && storageKey) {
        return await this.awsS3Service.generatePresignedUrl(storageKey, expiresIn);
      } else if (storageProvider === 'local' && filePath) {
        // For local files, return a direct file path or generate a temporary URL
        return `/documents/download/${path.basename(filePath)}`;
      } else if (storageProvider === 'hybrid') {
        // Try S3 first, fallback to local
        if (storageKey) {
          try {
            return await this.awsS3Service.generatePresignedUrl(storageKey, expiresIn);
          } catch (error) {
            this.logger.warn('S3 URL generation failed, using local fallback:', error);
            if (filePath) {
              return `/documents/download/${path.basename(filePath)}`;
            }
            throw error;
          }
        } else if (filePath) {
          return `/documents/download/${path.basename(filePath)}`;
        }
      }

      throw new BadRequestException('Invalid storage configuration for URL generation');
    } catch (error) {
      this.logger.error('Error generating file URL:', error);
      throw error;
    }
  }

  /**
   * Delete file from configured storage
   */
  async deleteFile(storageProvider: string, storageKey?: string, filePath?: string): Promise<void> {
    try {
      if (storageProvider === 'aws-s3' && storageKey) {
        await this.awsS3Service.deleteFile(storageKey);
      } else if (storageProvider === 'local' && filePath) {
        await this.deleteFromLocal(filePath);
      } else if (storageProvider === 'hybrid') {
        // Delete from both storages
        const promises: Promise<void>[] = [];

        if (storageKey) {
          promises.push(this.awsS3Service.deleteFile(storageKey));
        }

        if (filePath) {
          promises.push(this.deleteFromLocal(filePath));
        }

        await Promise.allSettled(promises);
        this.logger.log(`File deleted from hybrid storage: ${storageKey || filePath}`);
      }
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(
    storageProvider: string,
    storageKey?: string,
    filePath?: string,
  ): Promise<boolean> {
    try {
      if (storageProvider === 'aws-s3' && storageKey) {
        return await this.awsS3Service.fileExists(storageKey);
      } else if (storageProvider === 'local' && filePath) {
        return fs.existsSync(filePath);
      } else if (storageProvider === 'hybrid') {
        // Check both storages
        const checks: Promise<boolean>[] = [];

        if (storageKey) {
          checks.push(this.awsS3Service.fileExists(storageKey));
        }

        if (filePath) {
          checks.push(Promise.resolve(fs.existsSync(filePath)));
        }

        const results = await Promise.allSettled(checks);
        return results.some((result) => result.status === 'fulfilled' && result.value === true);
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Get storage configuration status
   */
  async getStorageStatus(): Promise<{
    storageType: string;
    local: {
      enabled: boolean;
      path: string;
      exists: boolean;
    };
    awsS3: {
      enabled: boolean;
      configured: boolean;
      region?: string;
      bucketName?: string;
    };
  }> {
    const localEnabled = this.storageType === 'local' || this.storageType === 'hybrid';
    const awsEnabled = this.storageType === 'aws-s3' || this.storageType === 'hybrid';

    let awsConfig: { enabled: boolean; configured: boolean; region?: string; bucketName?: string } =
      {
        enabled: false,
        configured: false,
      };
    if (awsEnabled) {
      const awsValidation = await this.awsS3Service.validateConfiguration();
      awsConfig = {
        enabled: true,
        configured: awsValidation.isValid,
        region: awsValidation.details.region,
        bucketName: awsValidation.details.bucketName,
      };
    }

    return {
      storageType: this.storageType,
      local: {
        enabled: localEnabled,
        path: this.uploadPath,
        exists: fs.existsSync(this.uploadPath),
      },
      awsS3: awsConfig,
    };
  }

  // Private methods for local storage operations
  private async uploadToLocal(
    file: any,
    entityType: string,
    entityId: string,
    fileName: string,
  ): Promise<StorageResult> {
    const storagePath = this.generateLocalStoragePath(entityType, entityId, fileName);
    const dir = path.dirname(storagePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(storagePath, file.buffer);

    return {
      storageProvider: 'local',
      filePath: storagePath,
    };
  }

  private async downloadFromLocal(filePath: string): Promise<FileDownloadResult> {
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found in local storage');
    }

    const buffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    // Determine content type from file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = this.getContentTypeFromExtension(ext);

    return {
      buffer,
      contentType,
      contentLength: stats.size,
    };
  }

  private async deleteFromLocal(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`File deleted from local storage: ${filePath}`);
    }
  }

  private generateLocalStoragePath(entityType: string, entityId: string, fileName: string): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    const entityPath = entityType.toLowerCase().replace(' ', '-');
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const baseFileName = fileName.replace(/\.[^/.]+$/, '');
    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    const fileNameWithTimestamp = `${timestamp}_${sanitizedFileName}.${fileExtension}`;

    return path.join(
      this.uploadPath,
      entityPath,
      entityId,
      year.toString(),
      month,
      day,
      fileNameWithTimestamp,
    );
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadPath}`);
    }
  }

  private getContentTypeFromExtension(ext: string): string {
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }
}
