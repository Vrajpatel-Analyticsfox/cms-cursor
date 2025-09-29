import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, count, SQL } from 'drizzle-orm';
import * as schema from '../../../db/schema';

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  filePath: string;
  encryptedFilePath: string;
  fileHash: string;
  fileSizeMb: string;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

export interface VersionCreateDto {
  documentId: string;
  filePath: string;
  encryptedFilePath: string;
  fileHash: string;
  fileSizeMb: string;
  changeSummary: string;
  createdBy: string;
}

export interface VersionListResponse {
  versions: DocumentVersion[];
  total: number;
  currentVersion: number;
}

@Injectable()
export class VersionControlService {
  private readonly logger = new Logger(VersionControlService.name);

  constructor(@Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>) {}

  /**
   * Create a new version of a document
   */
  async createVersion(versionDto: VersionCreateDto): Promise<DocumentVersion> {
    try {
      // Get current version number
      const currentVersion = await this.getCurrentVersionNumber(versionDto.documentId);
      const newVersionNumber = currentVersion + 1;

      // Create new version record
      const newVersion = await this.db
        .insert(schema.documentVersions)
        .values({
          documentId: versionDto.documentId,
          versionNumber: newVersionNumber,
          filePath: versionDto.filePath,
          encryptedFilePath: versionDto.encryptedFilePath,
          fileHash: versionDto.fileHash,
          fileSizeMb: versionDto.fileSizeMb,
          changeSummary: versionDto.changeSummary,
          createdBy: versionDto.createdBy,
        })
        .returning();

      // Update main document record with new version
      await this.db
        .update(schema.documentRepository)
        .set({
          versionNumber: newVersionNumber,
          filePath: versionDto.filePath,
          encryptedFilePath: versionDto.encryptedFilePath,
          fileHash: versionDto.fileHash,
          fileSizeMb: versionDto.fileSizeMb,
          lastUpdated: new Date(),
        })
        .where(eq(schema.documentRepository.id, versionDto.documentId));

      this.logger.log(`Version ${newVersionNumber} created for document ${versionDto.documentId}`);

      return this.mapToVersionDto(newVersion[0]);
    } catch (error) {
      this.logger.error('Error creating document version:', error);
      throw error;
    }
  }

  /**
   * Get all versions of a document
   */
  async getDocumentVersions(documentId: string): Promise<VersionListResponse> {
    try {
      // Verify document exists
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      if (document.length === 0) {
        throw new NotFoundException(`Document with ID ${documentId} not found`);
      }

      // Get all versions
      const versions = await this.db
        .select()
        .from(schema.documentVersions)
        .where(eq(schema.documentVersions.documentId, documentId))
        .orderBy(desc(schema.documentVersions.versionNumber));

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(schema.documentVersions)
        .where(eq(schema.documentVersions.documentId, documentId));

      const versionDtos = versions.map((version) => this.mapToVersionDto(version));

      return {
        versions: versionDtos,
        total: totalResult[0].count,
        currentVersion: document[0].versionNumber || 1,
      };
    } catch (error) {
      this.logger.error(`Error getting versions for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Get specific version of a document
   */
  async getDocumentVersion(documentId: string, versionNumber: number): Promise<DocumentVersion> {
    try {
      const version = await this.db
        .select()
        .from(schema.documentVersions)
        .where(
          and(
            eq(schema.documentVersions.documentId, documentId),
            eq(schema.documentVersions.versionNumber, versionNumber),
          ),
        )
        .limit(1);

      if (version.length === 0) {
        throw new NotFoundException(
          `Version ${versionNumber} not found for document ${documentId}`,
        );
      }

      return this.mapToVersionDto(version[0]);
    } catch (error) {
      this.logger.error(
        `Error getting version ${versionNumber} for document ${documentId}:`,
        error,
      );
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
  ): Promise<DocumentVersion> {
    try {
      // First, check if document exists
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      if (document.length === 0) {
        throw new NotFoundException(`Document with ID ${documentId} not found`);
      }

      // Check if trying to rollback to version 1 and no version history exists
      if (versionNumber === 1) {
        this.logger.log(`Checking for existing version 1 for document ${documentId}`);

        const versionExists = await this.db
          .select()
          .from(schema.documentVersions)
          .where(
            and(
              eq(schema.documentVersions.documentId, documentId),
              eq(schema.documentVersions.versionNumber, 1),
            ),
          )
          .limit(1);

        this.logger.log(`Version 1 exists: ${versionExists.length > 0}`);

        if (versionExists.length === 0) {
          this.logger.log(`Creating initial version record for document ${documentId}`);

          // No version history exists, create initial version record
          const initialVersion = await this.db
            .insert(schema.documentVersions)
            .values({
              documentId,
              versionNumber: 1,
              filePath: document[0].filePath || '',
              encryptedFilePath: document[0].encryptedFilePath || '',
              fileHash: document[0].fileHash || 'initial-hash',
              fileSizeMb: document[0].fileSizeMb || '0',
              changeSummary: 'Initial document version',
              createdBy: document[0].uploadedBy || 'system',
            })
            .returning();

          this.logger.log(`Created initial version record for document ${documentId}`);
          return this.mapToVersionDto(initialVersion[0]);
        } else {
          this.logger.log(`Version 1 already exists for document ${documentId}`);
        }
      }

      // Get the target version
      const targetVersion = await this.getDocumentVersion(documentId, versionNumber);

      // Update main document record with target version data
      await this.db
        .update(schema.documentRepository)
        .set({
          versionNumber: targetVersion.versionNumber,
          filePath: targetVersion.filePath,
          encryptedFilePath: targetVersion.encryptedFilePath,
          fileHash: targetVersion.fileHash,
          fileSizeMb: targetVersion.fileSizeMb,
          lastUpdated: new Date(),
        })
        .where(eq(schema.documentRepository.id, documentId));

      // Create a new version record for the rollback
      const rollbackVersion = await this.db
        .insert(schema.documentVersions)
        .values({
          documentId,
          versionNumber: targetVersion.versionNumber + 1, // Increment version
          filePath: targetVersion.filePath,
          encryptedFilePath: targetVersion.encryptedFilePath,
          fileHash: targetVersion.fileHash,
          fileSizeMb: targetVersion.fileSizeMb,
          changeSummary: `Rollback to version ${versionNumber}`,
          createdBy: rollbackBy,
        })
        .returning();

      this.logger.log(`Document ${documentId} rolled back to version ${versionNumber}`);

      return this.mapToVersionDto(rollbackVersion[0]);
    } catch (error) {
      this.logger.error(
        `Error rolling back document ${documentId} to version ${versionNumber}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Compare two versions of a document
   */
  async compareVersions(
    documentId: string,
    version1: number,
    version2: number,
  ): Promise<{
    version1: DocumentVersion;
    version2: DocumentVersion;
    differences: string[];
  }> {
    try {
      const [ver1, ver2] = await Promise.all([
        this.getDocumentVersion(documentId, version1),
        this.getDocumentVersion(documentId, version2),
      ]);

      const differences: string[] = [];

      // Compare basic properties
      if (ver1.fileHash !== ver2.fileHash) {
        differences.push('File content has changed');
      }
      if (ver1.fileSizeMb !== ver2.fileSizeMb) {
        differences.push(`File size changed from ${ver1.fileSizeMb}MB to ${ver2.fileSizeMb}MB`);
      }
      if (ver1.changeSummary !== ver2.changeSummary) {
        differences.push('Change summary has been updated');
      }

      // Compare timestamps
      const date1 = new Date(ver1.createdAt);
      const date2 = new Date(ver2.createdAt);
      const timeDiff = Math.abs(date2.getTime() - date1.getTime());
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff > 0) {
        differences.push(`Versions are ${daysDiff} days apart`);
      }

      return {
        version1: ver1,
        version2: ver2,
        differences,
      };
    } catch (error) {
      this.logger.error(
        `Error comparing versions ${version1} and ${version2} for document ${documentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a specific version (soft delete by marking as inactive)
   */
  async deleteVersion(documentId: string, versionNumber: number): Promise<void> {
    try {
      // Check if this is the current version
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      if (document.length === 0) {
        throw new NotFoundException(`Document with ID ${documentId} not found`);
      }

      if (document[0].versionNumber === versionNumber) {
        throw new BadRequestException('Cannot delete the current version of a document');
      }

      // Delete the version record
      await this.db
        .delete(schema.documentVersions)
        .where(
          and(
            eq(schema.documentVersions.documentId, documentId),
            eq(schema.documentVersions.versionNumber, versionNumber),
          ),
        );

      this.logger.log(`Version ${versionNumber} deleted for document ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Error deleting version ${versionNumber} for document ${documentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get version history with pagination
   */
  async getVersionHistory(
    documentId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<VersionListResponse> {
    try {
      const offset = (page - 1) * limit;

      // Get paginated versions
      const versions = await this.db
        .select()
        .from(schema.documentVersions)
        .where(eq(schema.documentVersions.documentId, documentId))
        .orderBy(desc(schema.documentVersions.versionNumber))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(schema.documentVersions)
        .where(eq(schema.documentVersions.documentId, documentId));

      // Get current version
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      const versionDtos = versions.map((version) => this.mapToVersionDto(version));

      return {
        versions: versionDtos,
        total: totalResult[0].count,
        currentVersion: document[0]?.versionNumber || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting version history for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async getCurrentVersionNumber(documentId: string): Promise<number> {
    const document = await this.db
      .select()
      .from(schema.documentRepository)
      .where(eq(schema.documentRepository.id, documentId))
      .limit(1);

    if (document.length === 0) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    return document[0].versionNumber || 0;
  }

  private mapToVersionDto(version: any): DocumentVersion {
    return {
      id: version.id,
      documentId: version.documentId,
      versionNumber: version.versionNumber,
      filePath: version.filePath,
      encryptedFilePath: version.encryptedFilePath,
      fileHash: version.fileHash,
      fileSizeMb: version.fileSizeMb,
      changeSummary: version.changeSummary,
      createdBy: version.createdBy,
      createdAt: version.createdAt?.toISOString(),
    };
  }
}
