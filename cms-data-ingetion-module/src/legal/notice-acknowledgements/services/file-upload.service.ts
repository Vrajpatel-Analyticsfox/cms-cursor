import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadProofDto } from '../dto';

export interface FileUploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  replacedExisting?: boolean;
  previousFilePath?: string | null;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadBasePath: string;
  private readonly maxFileSize: number;
  private readonly allowedFileTypes: string[];

  constructor(private readonly configService: ConfigService) {
    this.uploadBasePath = this.configService.get<string>(
      'FILE_UPLOAD_PATH',
      './uploads/acknowledgements',
    );
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB default
    this.allowedFileTypes = this.configService
      .get<string>('ALLOWED_FILE_TYPES', 'PDF,JPG,PNG,DOCX')
      .split(',');

    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Upload proof file for acknowledgement
   */
  async uploadProofFile(
    file: Express.Multer.File,
    uploadDto: UploadProofDto,
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate folder structure: /uploads/acknowledgements/YYYY/MM/DD/
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');

      const folderStructure = path.join('acknowledgements', year, month, day);
      const fullFolderPath = path.join(this.uploadBasePath, folderStructure);

      // Ensure folder structure exists
      await fs.promises.mkdir(fullFolderPath, { recursive: true });

      // Generate unique filename with timestamp and acknowledgement ID
      const fileExtension = path.extname(file.originalname);
      const timestamp = now.getTime();
      const uniqueFileName = `${uploadDto.acknowledgementId}_${timestamp}_${uuidv4().slice(0, 8)}${fileExtension}`;

      // Create full file path
      const filePath = path.join(fullFolderPath, uniqueFileName);

      // Save file
      await fs.promises.writeFile(filePath, file.buffer);

      // Return relative path from uploads base
      const relativePath = path.join(folderStructure, uniqueFileName).replace(/\\/g, '/');

      this.logger.log(
        `Proof file uploaded: ${relativePath} for acknowledgement ${uploadDto.acknowledgementId}`,
      );

      return {
        success: true,
        filePath: `/uploads/acknowledgements/${relativePath}`,
        fileName: uniqueFileName,
        fileSize: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to upload proof file:`, error);
      return {
        success: false,
        error: 'Failed to upload file',
      };
    }
  }

  /**
   * Generic file upload with folder structure
   */
  async uploadFile(
    file: Express.Multer.File,
    documentType: string,
    entityId: string,
    subFolder?: string,
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate folder structure: /uploads/{documentType}/YYYY/MM/DD/[subFolder]/
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');

      let folderStructure = path.join(documentType, year, month, day);
      if (subFolder) {
        folderStructure = path.join(folderStructure, subFolder);
      }

      const fullFolderPath = path.join(this.uploadBasePath, folderStructure);

      // Ensure folder structure exists
      await fs.promises.mkdir(fullFolderPath, { recursive: true });

      // Generate unique filename with timestamp and entity ID
      const fileExtension = path.extname(file.originalname);
      const timestamp = now.getTime();
      const uniqueFileName = `${entityId}_${timestamp}_${uuidv4().slice(0, 8)}${fileExtension}`;

      // Create full file path
      const filePath = path.join(fullFolderPath, uniqueFileName);

      // Save file
      await fs.promises.writeFile(filePath, file.buffer);

      // Return relative path from uploads base
      const relativePath = path.join(folderStructure, uniqueFileName).replace(/\\/g, '/');

      this.logger.log(`File uploaded: ${relativePath} for ${documentType} ${entityId}`);

      return {
        success: true,
        filePath: `/uploads/${relativePath}`,
        fileName: uniqueFileName,
        fileSize: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file:`, error);
      return {
        success: false,
        error: 'Failed to upload file',
      };
    }
  }

  /**
   * Get proof file
   */
  async getProofFile(filePath: string): Promise<Buffer | null> {
    try {
      const fullPath = path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        throw new NotFoundException(`Proof file not found: ${filePath}`);
      }

      return await fs.promises.readFile(fullPath);
    } catch (error) {
      this.logger.error(`Failed to get proof file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Delete proof file
   */
  async deleteProofFile(filePath: string): Promise<{ success: boolean; message: string }> {
    try {
      const fullPath = path.join(process.cwd(), filePath);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        this.logger.log(`Proof file deleted: ${filePath}`);
        return { success: true, message: 'File deleted successfully' };
      } else {
        return { success: false, message: 'File not found' };
      }
    } catch (error) {
      this.logger.error(`Failed to delete proof file ${filePath}:`, error);
      return { success: false, message: 'Failed to delete file' };
    }
  }

  /**
   * Generic file deletion method
   */
  async deleteFile(filePath: string): Promise<{ success: boolean; message: string }> {
    try {
      // Remove leading slash if present and ensure proper path
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = path.join(process.cwd(), cleanPath);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        this.logger.log(`File deleted: ${filePath}`);
        return { success: true, message: 'File deleted successfully' };
      } else {
        this.logger.warn(`File not found: ${filePath}`);
        return { success: false, message: 'File not found' };
      }
    } catch (error) {
      this.logger.error(`Failed to delete file ${filePath}:`, error);
      return { success: false, message: 'Failed to delete file' };
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File): FileValidationResult {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided',
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`,
      };
    }

    // Check file type by MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream', // For some file types that don't have specific MIME types
    ];

    // Check both MIME type and file extension for better compatibility
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    const allowedExtensions = [
      'pdf',
      'doc',
      'docx',
      'jpg',
      'jpeg',
      'png',
      'gif',
      'txt',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'zip',
    ];

    const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
    const isExtensionAllowed = allowedExtensions.includes(fileExtension);

    // Log file details for debugging
    this.logger.debug(
      `File validation - Name: ${file.originalname}, MIME: ${file.mimetype}, Extension: ${fileExtension}, MIME Allowed: ${isMimeTypeAllowed}, Extension Allowed: ${isExtensionAllowed}`,
    );

    if (!isMimeTypeAllowed && !isExtensionAllowed) {
      return {
        isValid: false,
        error: `File type not allowed. File: ${file.originalname} (MIME: ${file.mimetype}, Extension: ${fileExtension}). Allowed types: ${allowedMimeTypes.join(', ')} or extensions: ${allowedExtensions.join(', ')}`,
      };
    }

    // Check file name length
    if (file.originalname.length > 255) {
      return {
        isValid: false,
        error: 'File name too long (maximum 255 characters)',
      };
    }

    return { isValid: true };
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    try {
      if (!fs.existsSync(this.uploadBasePath)) {
        fs.mkdirSync(this.uploadBasePath, { recursive: true });
        this.logger.log(`Created upload directory: ${this.uploadBasePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create upload directory:`, error);
      throw new BadRequestException('Failed to initialize file upload system');
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size?: number;
    created?: Date;
    modified?: Date;
  }> {
    try {
      const fullPath = path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        return { exists: false };
      }

      const stats = await fs.promises.stat(fullPath);

      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      this.logger.error(`Failed to get file info for ${filePath}:`, error);
      return { exists: false };
    }
  }

  /**
   * Clean up old files (utility method)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<{ deletedCount: number; errors: string[] }> {
    try {
      const files = await fs.promises.readdir(this.uploadBasePath);
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      let deletedCount = 0;
      const errors: string[] = [];

      for (const file of files) {
        try {
          const filePath = path.join(this.uploadBasePath, file);
          const stats = await fs.promises.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.promises.unlink(filePath);
            deletedCount++;
            this.logger.log(`Cleaned up old file: ${file}`);
          }
        } catch (error) {
          errors.push(`Failed to delete ${file}: ${error.message}`);
        }
      }

      this.logger.log(`Cleanup completed: ${deletedCount} files deleted, ${errors.length} errors`);

      return { deletedCount, errors };
    } catch (error) {
      this.logger.error(`Failed to cleanup old files:`, error);
      return { deletedCount: 0, errors: [error.message] };
    }
  }

  /**
   * Upload legal case document
   */
  async uploadLegalCaseDocument(
    file: Express.Multer.File,
    caseId: string,
    documentType: string,
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, 'legal-cases', caseId, documentType);
  }

  /**
   * Upload borrower document
   */
  async uploadBorrowerDocument(
    file: Express.Multer.File,
    borrowerId: string,
    documentType: string,
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, 'borrowers', borrowerId, documentType);
  }

  /**
   * Upload lawyer document
   */
  async uploadLawyerDocument(
    file: Express.Multer.File,
    lawyerId: string,
    documentType: string,
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, 'lawyers', lawyerId, documentType);
  }

  /**
   * Upload template document
   */
  async uploadTemplateDocument(
    file: Express.Multer.File,
    templateId: string,
    documentType: string,
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, 'templates', templateId, documentType);
  }

  /**
   * Get upload statistics for specific document type
   */
  async getUploadStatistics(documentType?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypeDistribution: Record<string, number>;
    folderStructure: Record<string, number>;
    oldestFile?: Date;
    newestFile?: Date;
  }> {
    try {
      const basePath = documentType
        ? path.join(this.uploadBasePath, documentType)
        : this.uploadBasePath;

      if (!fs.existsSync(basePath)) {
        return {
          totalFiles: 0,
          totalSize: 0,
          fileTypeDistribution: {},
          folderStructure: {},
        };
      }

      const files = await this.getAllFilesRecursively(basePath);
      let totalSize = 0;
      const fileTypeDistribution: Record<string, number> = {};
      const folderStructure: Record<string, number> = {};
      let oldestFile: Date | undefined;
      let newestFile: Date | undefined;

      for (const fileInfo of files) {
        try {
          const stats = await fs.promises.stat(fileInfo.fullPath);
          totalSize += stats.size;

          // File type distribution
          const extension =
            path.extname(fileInfo.relativePath).toUpperCase().slice(1) || 'NO_EXTENSION';
          fileTypeDistribution[extension] = (fileTypeDistribution[extension] || 0) + 1;

          // Folder structure (count files per folder)
          const folder = path.dirname(fileInfo.relativePath);
          folderStructure[folder] = (folderStructure[folder] || 0) + 1;

          // Date tracking
          if (!oldestFile || stats.mtime < oldestFile) {
            oldestFile = stats.mtime;
          }
          if (!newestFile || stats.mtime > newestFile) {
            newestFile = stats.mtime;
          }
        } catch (error) {
          this.logger.warn(`Failed to process file ${fileInfo.relativePath}:`, error);
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        fileTypeDistribution,
        folderStructure,
        oldestFile,
        newestFile,
      };
    } catch (error) {
      this.logger.error(`Failed to get upload statistics:`, error);
      return {
        totalFiles: 0,
        totalSize: 0,
        fileTypeDistribution: {},
        folderStructure: {},
      };
    }
  }

  /**
   * Get all files recursively from a directory
   */
  private async getAllFilesRecursively(
    dir: string,
  ): Promise<Array<{ fullPath: string; relativePath: string }>> {
    const files: Array<{ fullPath: string; relativePath: string }> = [];

    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.uploadBasePath, fullPath);

        if (entry.isDirectory()) {
          const subFiles = await this.getAllFilesRecursively(fullPath);
          files.push(...subFiles);
        } else {
          files.push({ fullPath, relativePath });
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to read directory ${dir}:`, error);
    }

    return files;
  }
}
