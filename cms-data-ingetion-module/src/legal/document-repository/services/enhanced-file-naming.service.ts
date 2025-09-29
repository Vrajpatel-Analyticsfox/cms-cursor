import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, sql } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import * as path from 'path';

@Injectable()
export class EnhancedFileNamingService {
  private readonly logger = new Logger(EnhancedFileNamingService.name);

  constructor(@Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>) {}

  /**
   * Generate enhanced file name with sequence number for same-day documents
   */
  async generateEnhancedFileName(
    entityType: string,
    entityId: string,
    originalFileName: string,
    documentType: string,
  ): Promise<{
    fileName: string;
    filePath: string;
    sequenceNumber: number;
  }> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');

      // Get sequence number for same-day documents of same type
      const sequenceNumber = await this.getNextSequenceNumber(entityId, documentType, today);

      // Extract file extension and base name
      const fileExtension = originalFileName.split('.').pop() || '';
      const baseFileName = originalFileName.replace(/\.[^/.]+$/, '');
      const sanitizedBaseName = baseFileName.replace(/[^a-zA-Z0-9.-]/g, '_');

      // Generate enhanced file name
      const enhancedFileName = this.generateFileName(
        sanitizedBaseName,
        documentType,
        sequenceNumber,
        fileExtension,
      );

      // Generate file path
      const entityPath = entityType.toLowerCase().replace(' ', '-');
      const filePath = path.join(
        entityPath,
        entityId,
        year.toString(),
        month,
        day,
        enhancedFileName,
      );

      this.logger.log(
        `Generated enhanced file name: ${enhancedFileName} (sequence: ${sequenceNumber})`,
      );

      return {
        fileName: enhancedFileName,
        filePath,
        sequenceNumber,
      };
    } catch (error) {
      this.logger.error('Error generating enhanced file name:', error);
      throw error;
    }
  }

  /**
   * Get next sequence number for same-day documents of same type
   */
  private async getNextSequenceNumber(
    entityId: string,
    documentType: string,
    date: Date,
  ): Promise<number> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Count existing documents of same type on same day
      const result = await this.db
        .select({ count: count() })
        .from(schema.documentRepository)
        .where(
          and(
            eq(schema.documentRepository.linkedEntityId, entityId),
            eq(schema.documentRepository.linkedEntityType, 'Case ID'),
            eq(schema.documentRepository.documentType, documentType as any),
            sql`${schema.documentRepository.uploadDate} >= ${startOfDay}`,
            sql`${schema.documentRepository.uploadDate} <= ${endOfDay}`,
            eq(schema.documentRepository.confidentialFlag, false),
          ),
        );

      const currentCount = result[0]?.count || 0;
      return currentCount + 1;
    } catch (error) {
      this.logger.error('Error getting sequence number:', error);
      // Fallback to timestamp-based naming
      return Date.now();
    }
  }

  /**
   * Generate file name with sequence number
   */
  private generateFileName(
    baseName: string,
    documentType: string,
    sequenceNumber: number,
    fileExtension: string,
  ): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');

    // Format sequence number with leading zeros (e.g., 001, 002, 003)
    const formattedSequence = sequenceNumber.toString().padStart(3, '0');

    // Generate file name: YYYYMMDD_HHMMSS_Type_Sequence_OriginalName.ext
    return `${timestamp}_${documentType}_${formattedSequence}_${baseName}.${fileExtension}`;
  }

  /**
   * Get document sequence information
   */
  async getDocumentSequenceInfo(
    entityId: string,
    documentType: string,
    date: Date,
  ): Promise<{
    totalDocuments: number;
    lastSequenceNumber: number;
    nextSequenceNumber: number;
  }> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await this.db
        .select({ count: count() })
        .from(schema.documentRepository)
        .where(
          and(
            eq(schema.documentRepository.linkedEntityId, entityId),
            eq(schema.documentRepository.linkedEntityType, 'Case ID'),
            eq(schema.documentRepository.documentType, documentType as any),
            sql`${schema.documentRepository.uploadDate} >= ${startOfDay}`,
            sql`${schema.documentRepository.uploadDate} <= ${endOfDay}`,
            eq(schema.documentRepository.confidentialFlag, false),
          ),
        );

      const totalDocuments = result[0]?.count || 0;
      const lastSequenceNumber = totalDocuments;
      const nextSequenceNumber = totalDocuments + 1;

      return {
        totalDocuments,
        lastSequenceNumber,
        nextSequenceNumber,
      };
    } catch (error) {
      this.logger.error('Error getting document sequence info:', error);
      throw error;
    }
  }

  /**
   * Get all documents of same type for a case on a specific date
   */
  async getSameDayDocuments(
    entityId: string,
    documentType: string,
    date: Date,
  ): Promise<
    Array<{
      id: string;
      documentName: string;
      originalFileName: string;
      uploadDate: Date;
      sequenceNumber: number;
    }>
  > {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const documents = await this.db
        .select({
          id: schema.documentRepository.id,
          documentName: schema.documentRepository.documentName,
          originalFileName: schema.documentRepository.originalFileName,
          uploadDate: schema.documentRepository.uploadDate,
        })
        .from(schema.documentRepository)
        .where(
          and(
            eq(schema.documentRepository.linkedEntityId, entityId),
            eq(schema.documentRepository.linkedEntityType, 'Case ID'),
            eq(schema.documentRepository.documentType, documentType as any),
            sql`${schema.documentRepository.uploadDate} >= ${startOfDay}`,
            sql`${schema.documentRepository.uploadDate} <= ${endOfDay}`,
            eq(schema.documentRepository.confidentialFlag, false),
          ),
        )
        .orderBy(schema.documentRepository.uploadDate);

      // Add sequence numbers
      return documents.map((doc, index) => ({
        ...doc,
        sequenceNumber: index + 1,
        uploadDate: doc.uploadDate || new Date(), // Handle null uploadDate
      }));
    } catch (error) {
      this.logger.error('Error getting same-day documents:', error);
      throw error;
    }
  }
}
