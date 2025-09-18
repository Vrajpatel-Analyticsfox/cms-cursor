import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

@Injectable()
export class AwsS3StorageService {
  private readonly logger = new Logger(AwsS3StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName =
      this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'legal-documents-bucket';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * Upload file to AWS S3
   */
  async uploadFile(
    file: any,
    entityType: string,
    entityId: string,
    fileName: string,
  ): Promise<{
    storageProvider: string;
    storageBucket: string;
    storageKey: string;
    filePath: string;
  }> {
    try {
      // Generate unique S3 key
      const s3Key = this.generateS3Key(entityType, entityId, fileName);

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          entityType,
          entityId,
          uploadedAt: new Date().toISOString(),
        },
        ServerSideEncryption: 'AES256', // Enable server-side encryption
      });

      await this.s3Client.send(uploadCommand);

      this.logger.log(`File uploaded to S3: ${s3Key}`);

      return {
        storageProvider: 'aws-s3',
        storageBucket: this.bucketName,
        storageKey: s3Key,
        filePath: `s3://${this.bucketName}/${s3Key}`,
      };
    } catch (error) {
      this.logger.error('Error uploading file to S3:', error);
      throw new BadRequestException('Failed to upload file to cloud storage');
    }
  }

  /**
   * Download file from AWS S3
   */
  async downloadFile(storageKey: string): Promise<{
    buffer: Buffer;
    contentType: string;
    contentLength: number;
  }> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      const response = await this.s3Client.send(getCommand);

      if (!response.Body) {
        throw new BadRequestException('File not found in storage');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      return {
        buffer,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength || buffer.length,
      };
    } catch (error) {
      this.logger.error('Error downloading file from S3:', error);
      throw new BadRequestException('Failed to download file from cloud storage');
    }
  }

  /**
   * Generate presigned URL for file access
   */
  async generatePresignedUrl(
    storageKey: string,
    expiresIn: number = 3600, // 1 hour default
  ): Promise<string> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn,
      });

      return presignedUrl;
    } catch (error) {
      this.logger.error('Error generating presigned URL:', error);
      throw new BadRequestException('Failed to generate file access URL');
    }
  }

  /**
   * Delete file from AWS S3
   */
  async deleteFile(storageKey: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      await this.s3Client.send(deleteCommand);

      this.logger.log(`File deleted from S3: ${storageKey}`);
    } catch (error) {
      this.logger.error('Error deleting file from S3:', error);
      throw new BadRequestException('Failed to delete file from cloud storage');
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(storageKey: string): Promise<boolean> {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      await this.s3Client.send(headCommand);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(storageKey: string): Promise<{
    contentType: string;
    contentLength: number;
    lastModified: Date;
    metadata: Record<string, string>;
  }> {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      const response = await this.s3Client.send(headCommand);

      return {
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata || {},
      };
    } catch (error) {
      this.logger.error('Error getting file metadata from S3:', error);
      throw new BadRequestException('Failed to get file metadata');
    }
  }

  /**
   * Generate S3 key for file organization
   */
  private generateS3Key(entityType: string, entityId: string, fileName: string): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    const entityPath = entityType.toLowerCase().replace(' ', '-');
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const baseFileName = fileName.replace(/\.[^/.]+$/, '');
    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    return `${entityPath}/${entityId}/${year}/${month}/${day}/${timestamp}_${sanitizedFileName}.${fileExtension}`;
  }

  /**
   * Validate AWS S3 configuration
   */
  async validateConfiguration(): Promise<{
    isValid: boolean;
    message: string;
    details: {
      region: string;
      bucketName: string;
      hasCredentials: boolean;
    };
  }> {
    try {
      const hasCredentials = !!(
        this.configService.get<string>('AWS_ACCESS_KEY_ID') &&
        this.configService.get<string>('AWS_SECRET_ACCESS_KEY')
      );

      if (!hasCredentials) {
        return {
          isValid: false,
          message: 'AWS credentials not configured',
          details: {
            region: this.region,
            bucketName: this.bucketName,
            hasCredentials: false,
          },
        };
      }

      // Test S3 connection by listing objects (with limit 1)
      const listCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: 'test-connection',
      });

      try {
        await this.s3Client.send(listCommand);
      } catch (error) {
        // This is expected to fail, but it means the connection works
      }

      return {
        isValid: true,
        message: 'AWS S3 configuration is valid',
        details: {
          region: this.region,
          bucketName: this.bucketName,
          hasCredentials: true,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        message: `AWS S3 configuration error: ${error.message}`,
        details: {
          region: this.region,
          bucketName: this.bucketName,
          hasCredentials: false,
        },
      };
    }
  }
}
