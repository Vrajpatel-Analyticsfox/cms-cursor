# File Upload Structure Documentation

## Overview

The file upload system has been enhanced with a comprehensive folder structure to better organize and manage documents across different legal modules. This structure ensures proper document management and scalability for future file-related services.

## Folder Structure

### Base Structure

```
uploads/
├── acknowledgements/
│   └── YYYY/
│       └── MM/
│           └── DD/
│               └── {acknowledgementId}_{timestamp}_{uuid}.{ext}
├── legal-cases/
│   └── YYYY/
│       └── MM/
│           └── DD/
│               └── {subFolder}/
│                   └── {caseId}_{timestamp}_{uuid}.{ext}
├── borrowers/
│   └── YYYY/
│       └── MM/
│           └── DD/
│               └── {subFolder}/
│                   └── {borrowerId}_{timestamp}_{uuid}.{ext}
├── lawyers/
│   └── YYYY/
│       └── MM/
│           └── DD/
│               └── {subFolder}/
│                   └── {lawyerId}_{timestamp}_{uuid}.{ext}
└── templates/
    └── YYYY/
        └── MM/
            └── DD/
                └── {subFolder}/
                    └── {templateId}_{timestamp}_{uuid}.{ext}
```

## Document Types and Subfolders

### 1. Acknowledgements

- **Path**: `uploads/acknowledgements/YYYY/MM/DD/`
- **Subfolders**: None (direct date organization)
- **File Naming**: `{acknowledgementId}_{timestamp}_{uuid}.{ext}`
- **Example**: `uploads/acknowledgements/2025/01/21/ACKN-20250121-0001_1641234567890_a1b2c3d4.pdf`

### 2. Legal Cases

- **Path**: `uploads/legal-cases/YYYY/MM/DD/{subFolder}/`
- **Subfolders**:
  - `contracts` - Legal contracts and agreements
  - `evidence` - Evidence documents and exhibits
  - `correspondence` - Letters and communications
  - `court-documents` - Court filings and orders
  - `reports` - Case reports and analysis
- **File Naming**: `{caseId}_{timestamp}_{uuid}.{ext}`
- **Example**: `uploads/legal-cases/2025/01/21/contracts/case123_1641234567890_a1b2c3d4.pdf`

### 3. Borrowers

- **Path**: `uploads/borrowers/YYYY/MM/DD/{subFolder}/`
- **Subfolders**:
  - `identity` - Identity documents (Aadhaar, PAN, etc.)
  - `address-proof` - Address verification documents
  - `income-proof` - Income statements and salary slips
  - `bank-statements` - Bank statements and financial records
  - `loan-documents` - Loan-related documents
- **File Naming**: `{borrowerId}_{timestamp}_{uuid}.{ext}`
- **Example**: `uploads/borrowers/2025/01/21/identity/borrower456_1641234567890_a1b2c3d4.pdf`

### 4. Lawyers

- **Path**: `uploads/lawyers/YYYY/MM/DD/{subFolder}/`
- **Subfolders**:
  - `license` - Bar license and certifications
  - `credentials` - Educational and professional credentials
  - `contracts` - Engagement agreements and contracts
  - `case-files` - Case-specific documents
  - `correspondence` - Client communications
- **File Naming**: `{lawyerId}_{timestamp}_{uuid}.{ext}`
- **Example**: `uploads/lawyers/2025/01/21/license/lawyer789_1641234567890_a1b2c3d4.pdf`

### 5. Templates

- **Path**: `uploads/templates/YYYY/MM/DD/{subFolder}/`
- **Subfolders**:
  - `templates` - Template files and documents
  - `samples` - Sample documents and examples
  - `attachments` - Template attachments and resources
  - `versions` - Different versions of templates
- **File Naming**: `{templateId}_{timestamp}_{uuid}.{ext}`
- **Example**: `uploads/templates/2025/01/21/templates/temp123_1641234567890_a1b2c3d4.docx`

## API Endpoints

### File Management Controller (`/legal/files`)

#### 1. Generic Upload

```
POST /legal/files/upload/{documentType}/{entityId}?subFolder={subFolder}
```

- **documentType**: acknowledgements, legal-cases, borrowers, lawyers, templates
- **entityId**: UUID of the entity
- **subFolder**: Optional subfolder within the date folder

#### 2. Specific Document Type Uploads

```
POST /legal/files/upload/legal-case/{caseId}?documentType={documentType}
POST /legal/files/upload/borrower/{borrowerId}?documentType={documentType}
POST /legal/files/upload/lawyer/{lawyerId}?documentType={documentType}
POST /legal/files/upload/template/{templateId}?documentType={documentType}
```

#### 3. File Operations

```
GET /legal/files/download/{filePath} - Download file
DELETE /legal/files/delete/{filePath} - Delete file
GET /legal/files/statistics?documentType={documentType} - Get statistics
GET /legal/files/cleanup?daysOld={days} - Cleanup old files
```

### Notice Acknowledgement Controller (`/legal/notice-acknowledgements`)

#### File Operations for Acknowledgements

```
POST /legal/notice-acknowledgements/{id}/upload-proof - Upload proof file
GET /legal/notice-acknowledgements/{id}/proof - Download proof file
DELETE /legal/notice-acknowledgements/{id}/proof - Delete proof file
GET /legal/notice-acknowledgements/file-upload/statistics - Get statistics
```

## File Naming Convention

### Format

```
{entityId}_{timestamp}_{uuid}.{extension}
```

### Components

- **entityId**: ID of the associated entity (acknowledgement, case, borrower, etc.)
- **timestamp**: Unix timestamp in milliseconds for uniqueness
- **uuid**: First 8 characters of UUID for additional uniqueness
- **extension**: Original file extension (lowercase)

### Examples

```
ACKN-20250121-0001_1641234567890_a1b2c3d4.pdf
case123_1641234567890_a1b2c3d4.jpg
borrower456_1641234567890_a1b2c3d4.png
lawyer789_1641234567890_a1b2c3d4.docx
```

## Benefits

### 1. Organization

- **Date-based structure**: Easy to find files by upload date
- **Type-based separation**: Different document types are clearly separated
- **Subfolder categorization**: Further organization within document types

### 2. Scalability

- **Performance**: Reduces file system load by distributing files across folders
- **Maintenance**: Easy to archive or cleanup old files by date
- **Backup**: Simplified backup strategies based on date ranges

### 3. Security

- **Access control**: Can implement folder-level permissions
- **Audit trail**: Clear tracking of when files were uploaded
- **Isolation**: Different document types are isolated from each other

### 4. Future Services

- **Document management**: Easy to implement document management features
- **Search and indexing**: Folder structure supports efficient search
- **Analytics**: Better analytics and reporting capabilities

## Configuration

### Environment Variables

```env
FILE_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=PDF,JPG,PNG,DOCX
```

### File Validation

- **Size limit**: Configurable maximum file size
- **File types**: Configurable allowed file extensions
- **Name length**: Maximum 255 characters for original filename

## Statistics and Monitoring

### Available Statistics

- **Total files**: Count of all uploaded files
- **Total size**: Total storage used
- **File type distribution**: Breakdown by file extension
- **Folder structure**: Files per folder
- **Date range**: Oldest and newest files

### Example Statistics Response

```json
{
  "totalFiles": 150,
  "totalSize": 52428800,
  "fileTypeDistribution": {
    "PDF": 80,
    "JPG": 45,
    "PNG": 25
  },
  "folderStructure": {
    "acknowledgements/2025/01/21": 10,
    "acknowledgements/2025/01/22": 15,
    "legal-cases/2025/01/21/contracts": 5
  },
  "oldestFile": "2025-01-15T10:30:00Z",
  "newestFile": "2025-01-21T16:45:00Z"
}
```

## Migration and Cleanup

### Cleanup Old Files

```bash
GET /legal/files/cleanup?daysOld=30
```

- Removes files older than specified days
- Returns count of deleted files and any errors
- Safe operation with error handling

### Future Enhancements

- **Compression**: Automatic file compression for storage optimization
- **CDN Integration**: Support for content delivery networks
- **Version Control**: File versioning and history tracking
- **Metadata**: Extended file metadata and tagging
- **Search**: Full-text search across file contents
