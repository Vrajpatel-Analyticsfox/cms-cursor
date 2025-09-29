import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../../../db/schema';

export interface AccessPermission {
  role: string;
  permissions: string[];
}

export interface AccessLogEntry {
  id: string;
  documentId: string;
  accessedBy: string;
  accessType: 'VIEW' | 'DOWNLOAD' | 'UPDATE' | 'DELETE';
  ipAddress?: string;
  userAgent?: string;
  accessedAt: string;
}

export interface AccessControlResult {
  hasAccess: boolean;
  reason?: string;
  permissions: string[];
}

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(@Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>) {}

  /**
   * Check if user has access to a document
   */
  async checkDocumentAccess(
    documentId: string,
    userId: string,
    userRole: string,
    requestedAction: 'VIEW' | 'DOWNLOAD' | 'UPDATE' | 'DELETE' = 'VIEW',
  ): Promise<AccessControlResult> {
    try {
      // Get document details
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      if (document.length === 0) {
        return {
          hasAccess: false,
          reason: 'Document not found',
          permissions: [],
        };
      }

      const doc = document[0];

      // Parse access permissions
      const accessPermissions = JSON.parse(doc.accessPermissions || '[]');

      // Check if user role has access
      const hasRoleAccess = accessPermissions.includes(userRole);

      // Check if user is the uploader (always has access)
      const isUploader = doc.uploadedBy === userId;

      // Check if document is confidential
      if (doc.confidentialFlag && !hasRoleAccess && !isUploader) {
        return {
          hasAccess: false,
          reason: 'Access denied: Document is confidential',
          permissions: [],
        };
      }

      // Check specific action permissions
      const actionPermissions = this.getActionPermissions(requestedAction);
      const hasActionAccess = this.checkActionPermissions(
        userRole,
        actionPermissions,
        hasRoleAccess,
        isUploader,
      );

      if (!hasActionAccess) {
        return {
          hasAccess: false,
          reason: `Access denied: Insufficient permissions for ${requestedAction}`,
          permissions: accessPermissions,
        };
      }

      // Log access attempt
      await this.logAccess(documentId, userId, requestedAction);

      return {
        hasAccess: true,
        permissions: accessPermissions,
      };
    } catch (error) {
      this.logger.error(`Error checking access for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's permissions for a document
   */
  async getUserPermissions(
    documentId: string,
    userId: string,
    userRole: string,
  ): Promise<string[]> {
    try {
      const document = await this.db
        .select()
        .from(schema.documentRepository)
        .where(eq(schema.documentRepository.id, documentId))
        .limit(1);

      if (document.length === 0) {
        return [];
      }

      const doc = document[0];
      const accessPermissions = JSON.parse(doc.accessPermissions || '[]');
      const isUploader = doc.uploadedBy === userId;

      // If user is uploader, they have all permissions
      if (isUploader) {
        return ['VIEW', 'DOWNLOAD', 'UPDATE', 'DELETE'];
      }

      // If user role has access, return role-based permissions
      if (accessPermissions.includes(userRole)) {
        return this.getRolePermissions(userRole);
      }

      // If document is not confidential and user has basic access
      if (!doc.confidentialFlag) {
        return ['VIEW'];
      }

      return [];
    } catch (error) {
      this.logger.error(`Error getting permissions for document ${documentId}:`, error);
      return [];
    }
  }

  /**
   * Get access log for a document
   */
  async getDocumentAccessLog(
    documentId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<AccessLogEntry[]> {
    try {
      const offset = (page - 1) * limit;

      const accessLogs = await this.db
        .select()
        .from(schema.documentAccessLog)
        .where(eq(schema.documentAccessLog.documentId, documentId))
        .orderBy(desc(schema.documentAccessLog.accessedAt))
        .limit(limit)
        .offset(offset);

      return accessLogs.map((log) => ({
        id: log.id,
        documentId: log.documentId,
        accessedBy: log.accessedBy,
        accessType: log.accessType as 'VIEW' | 'DOWNLOAD' | 'UPDATE' | 'DELETE',
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        accessedAt: log.accessedAt?.toISOString() || new Date().toISOString(),
      }));
    } catch (error) {
      this.logger.error(`Error getting access log for document ${documentId}:`, error);
      return [];
    }
  }

  /**
   * Get access statistics for a document
   */
  async getDocumentAccessStats(documentId: string): Promise<{
    totalAccesses: number;
    uniqueUsers: number;
    accessTypes: { [key: string]: number };
    lastAccessed: string | null;
    mostActiveUser: string | null;
  }> {
    try {
      const accessLogs = await this.db
        .select()
        .from(schema.documentAccessLog)
        .where(eq(schema.documentAccessLog.documentId, documentId))
        .orderBy(desc(schema.documentAccessLog.accessedAt));

      const totalAccesses = accessLogs.length;
      const uniqueUsers = new Set(accessLogs.map((log) => log.accessedBy)).size;

      const accessTypes: { [key: string]: number } = {};
      accessLogs.forEach((log) => {
        accessTypes[log.accessType] = (accessTypes[log.accessType] || 0) + 1;
      });

      const lastAccessed =
        accessLogs.length > 0 ? accessLogs[0].accessedAt?.toISOString() || null : null;

      // Find most active user
      const userAccessCounts: { [key: string]: number } = {};
      accessLogs.forEach((log) => {
        userAccessCounts[log.accessedBy] = (userAccessCounts[log.accessedBy] || 0) + 1;
      });

      const mostActiveUser = Object.keys(userAccessCounts).reduce((a, b) =>
        userAccessCounts[a] > userAccessCounts[b] ? a : b,
      );

      return {
        totalAccesses,
        uniqueUsers,
        accessTypes,
        lastAccessed,
        mostActiveUser: mostActiveUser || null,
      };
    } catch (error) {
      this.logger.error(`Error getting access stats for document ${documentId}:`, error);
      return {
        totalAccesses: 0,
        uniqueUsers: 0,
        accessTypes: {},
        lastAccessed: null,
        mostActiveUser: null,
      };
    }
  }

  /**
   * Check if user can perform bulk operations
   */
  async checkBulkAccess(
    documentIds: string[],
    userId: string,
    userRole: string,
    action: 'VIEW' | 'DOWNLOAD' | 'UPDATE' | 'DELETE',
  ): Promise<{ [documentId: string]: boolean }> {
    try {
      const results: { [documentId: string]: boolean } = {};

      // Check access for each document
      for (const documentId of documentIds) {
        const accessResult = await this.checkDocumentAccess(documentId, userId, userRole, action);
        results[documentId] = accessResult.hasAccess;
      }

      return results;
    } catch (error) {
      this.logger.error(`Error checking bulk access:`, error);
      return {};
    }
  }

  /**
   * Private helper methods
   */

  private getActionPermissions(action: string): string[] {
    const actionMap: { [key: string]: string[] } = {
      VIEW: ['Legal Officer', 'Admin', 'Compliance', 'Lawyer'],
      DOWNLOAD: ['Legal Officer', 'Admin', 'Compliance', 'Lawyer'],
      UPDATE: ['Legal Officer', 'Admin'],
      DELETE: ['Admin'],
    };

    return actionMap[action] || [];
  }

  private getRolePermissions(role: string): string[] {
    const roleMap: { [key: string]: string[] } = {
      'Legal Officer': ['VIEW', 'DOWNLOAD', 'UPDATE'],
      Admin: ['VIEW', 'DOWNLOAD', 'UPDATE', 'DELETE'],
      Compliance: ['VIEW', 'DOWNLOAD'],
      Lawyer: ['VIEW', 'DOWNLOAD'],
    };

    return roleMap[role] || ['VIEW'];
  }

  private checkActionPermissions(
    userRole: string,
    requiredRoles: string[],
    hasRoleAccess: boolean,
    isUploader: boolean,
  ): boolean {
    // Uploader always has access
    if (isUploader) {
      return true;
    }

    // Check if user role is in required roles
    if (requiredRoles.includes(userRole) && hasRoleAccess) {
      return true;
    }

    return false;
  }

  private async logAccess(
    documentId: string,
    userId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.db.insert(schema.documentAccessLog).values({
        documentId,
        accessedBy: userId,
        accessType: action as 'VIEW' | 'DOWNLOAD' | 'UPDATE' | 'DELETE',
        ipAddress,
        userAgent,
      });
    } catch (error) {
      this.logger.error('Error logging access:', error);
      // Don't throw error for logging failures
    }
  }
}
