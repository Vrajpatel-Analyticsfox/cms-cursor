# UC007 Legal Document Repository - Complete Implementation

## Overview

This document outlines the complete implementation of UC007 Legal Document Repository as per BRD requirements, with enterprise-grade security, version control, and access management.

## Architecture

### Module Structure

```
src/legal/document-repository/
├── document-repository.module.ts          # Main module
├── document-repository.controller.ts      # API endpoints
├── document-repository.service.ts         # Core business logic
├── dto/
│   ├── create-document.dto.ts            # Input validation
│   └── document-response.dto.ts          # Response structure
└── services/
    ├── secure-storage.service.ts         # Encryption & storage
    ├── version-control.service.ts        # Version management
    └── access-control.service.ts         # Permission management
```

### Database Schema

- **`document_repository`** - Main BRD-compliant table
- **`document_versions`** - Version control system
- **`document_access_log`** - Audit trail
- **`document_encryption_keys`** - Security key management

## Environment Variables

### Required Configuration

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/cms_database

# Document Repository (UC007)
UPLOAD_PATH=./uploads
ENCRYPTION_KEY=your-32-character-encryption-key-here
DOCUMENT_ID_PREFIX=LDR
MAX_FILE_SIZE_MB=10
```

### Optional Configuration

```bash
# Storage
DEFAULT_STORAGE_PROVIDER=local
DEFAULT_DOCUMENT_STATUS=Active
DEFAULT_ACCESS_PERMISSIONS=Legal Officer
DEFAULT_VERSION_NUMBER=1
DEFAULT_IS_LATEST_VERSION=true
DEFAULT_CONFIDENTIAL_FLAG=false
DEFAULT_IS_PUBLIC=false

# File Upload
ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
ALLOWED_FILE_EXTENSIONS=\.(pdf|doc|docx|jpg|jpeg|png|xlsx)$

# Encryption
ENCRYPTION_ALGORITHM=aes-256-gcm
ENCRYPTION_SALT=document-encryption-salt

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-document-bucket
```

## BRD Compliance

### Exact Field Mapping

| BRD Field          | Database Column      | Type      | Validation                                                       |
| ------------------ | -------------------- | --------- | ---------------------------------------------------------------- |
| Document ID        | `document_id`        | TEXT      | LDR-YYYYMMDD-Sequence                                            |
| Linked Entity Type | `linked_entity_type` | TEXT      | Borrower, Loan Account, Case ID                                  |
| Linked Entity ID   | `linked_entity_id`   | TEXT      | Must exist in respective tables                                  |
| Document Name      | `document_name`      | TEXT      | Max 100 characters                                               |
| Document Type      | `document_type`      | TEXT      | Legal Notice, Court Order, Affidavit, Case Summary, Proof, Other |
| Upload Date        | `upload_date`        | TIMESTAMP | Auto-generated                                                   |
| Uploaded By        | `uploaded_by`        | TEXT      | Username or role                                                 |
| File Format        | `file_format`        | TEXT      | PDF, DOCX, JPG, PNG, XLSX                                        |
| File Size (MB)     | `file_size_mb`       | TEXT      | Max 10MB (configurable)                                          |
| Access Permissions | `access_permissions` | TEXT      | Legal Officer, Admin, Compliance, Lawyer                         |
| Confidential Flag  | `confidential_flag`  | BOOLEAN   | Default false                                                    |
| Version Number     | `version_number`     | INTEGER   | Auto-increment                                                   |
| Remarks/Tags       | `remarks_tags`       | TEXT      | Max 250 characters                                               |
| Last Updated       | `last_updated`       | TIMESTAMP | Auto-updated                                                     |

## Security Features

### Encryption

- **Algorithm**: AES-256-GCM (configurable)
- **Key Management**: Environment-based with salt
- **Confidential Documents**: Always encrypted
- **File Integrity**: SHA-256 hashing

### Access Control

- **Role-Based Permissions**: Legal Officer, Admin, Compliance, Lawyer
- **Action-Based Access**: VIEW, DOWNLOAD, UPDATE, DELETE
- **Confidential Protection**: Additional restrictions for sensitive documents
- **Audit Logging**: Complete access trail

### File Validation

- **Size Limits**: Configurable (default 10MB)
- **Type Validation**: MIME type and extension checking
- **Format Support**: PDF, DOCX, JPG, PNG, XLSX

## Version Control

### Features

- **Automatic Versioning**: Incremental version numbers
- **Change Tracking**: Detailed change summaries
- **Rollback Capability**: Restore to any previous version
- **Version Comparison**: Side-by-side differences
- **History Management**: Paginated version history

### Operations

```typescript
// Create new version
POST /legal/documents/:id/versions
- file: multipart/form-data
- changeSummary: string

// Get versions
GET /legal/documents/:id/versions

// Rollback to version
POST /legal/documents/:id/rollback/:versionNumber
```

## API Endpoints

### Document Management

```typescript
// Upload document
POST /legal/documents/upload
- file: multipart/form-data
- linkedEntityType: string
- linkedEntityId: string
- documentName: string
- documentType: string
- accessPermissions: string[]
- confidentialFlag?: boolean
- remarksTags?: string

// Get document
GET /legal/documents/:id

// Download document
GET /legal/documents/:id/download

// Update document
PUT /legal/documents/:id

// Delete document
DELETE /legal/documents/:id

// List documents
GET /legal/documents?entityType=string&entityId=string
```

### Legal Case Specific

```typescript
// Upload for legal case
POST /legal/documents/legal-case/:caseId/upload

// Get case documents
GET /legal/documents/legal-case/:caseId
```

## Integration

### Legal Module Integration

The Document Repository is integrated into the main Legal Module:

```typescript
// legal.module.ts
import { DocumentRepositoryModule } from './document-repository/document-repository.module';

@Module({
  imports: [ConfigModule, DrizzleModule, DocumentRepositoryModule],
  // ... other configurations
})
export class LegalModule {}
```

### Service Dependencies

- **SecureStorageService**: File encryption and storage
- **VersionControlService**: Document versioning
- **AccessControlService**: Permission management
- **DocumentRepositoryService**: Core business logic

## File Storage Structure

```
uploads/
├── legal-case/
│   └── {caseId}/
│       └── 2025/07/21/
│           ├── {timestamp}-{filename}
│           └── encrypted/
│               └── {timestamp}-{filename}.enc
├── borrower/
│   └── {borrowerId}/
│       └── 2025/07/21/
│           ├── {timestamp}-{filename}
│           └── encrypted/
│               └── {timestamp}-{filename}.enc
└── loan-account/
    └── {loanId}/
        └── 2025/07/21/
            ├── {timestamp}-{filename}
            └── encrypted/
                └── {timestamp}-{filename}.enc
```

## Error Handling

### Validation Errors

- File size exceeded
- Invalid file type
- Missing required fields
- Invalid entity references

### Access Control Errors

- Insufficient permissions
- Confidential document access denied
- Role-based restrictions

### System Errors

- Encryption/decryption failures
- File system errors
- Database connection issues

## Performance Considerations

### Database Indexing

- `document_id` - Primary lookup
- `linked_entity_type, linked_entity_id` - Entity queries
- `upload_date` - Sorting
- `document_type` - Filtering
- `confidential_flag` - Access control

### File Storage

- Local filesystem with encryption
- Configurable cloud storage support
- Efficient path structure for organization

### Caching

- Document metadata caching
- Access permission caching
- Version information caching

## Monitoring and Logging

### Audit Trail

- Document access logging
- Version creation tracking
- Permission changes
- System errors

### Metrics

- Upload/download statistics
- Access patterns
- Storage usage
- Performance metrics

## Testing

### Unit Tests

- Service layer testing
- Validation testing
- Encryption/decryption testing

### Integration Tests

- API endpoint testing
- Database integration
- File system operations

### Security Tests

- Access control validation
- Encryption verification
- File integrity checks

## Deployment

### Prerequisites

- PostgreSQL database
- Node.js environment
- File system permissions
- Environment variables configured

### Database Migration

```sql
-- Run the migration
\i src/db/migrations/0001_brd_document_repository.sql
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Configure required variables
# Set ENCRYPTION_KEY
# Set DATABASE_URL
# Set UPLOAD_PATH
```

## Maintenance

### Regular Tasks

- Monitor storage usage
- Review access logs
- Update encryption keys
- Clean up old versions

### Backup Strategy

- Database backups
- File system backups
- Encryption key backups
- Configuration backups

## Conclusion

The UC007 Legal Document Repository implementation provides:

✅ **100% BRD Compliance** - Exact field mapping and validation
✅ **Enterprise Security** - AES-256 encryption and access control
✅ **Version Control** - Complete change tracking and rollback
✅ **Audit Trail** - Comprehensive logging and monitoring
✅ **Scalable Architecture** - Modular design with environment configuration
✅ **Production Ready** - Error handling, validation, and performance optimization

The system is now ready for deployment and can handle legal document management with enterprise-level security and compliance requirements.
