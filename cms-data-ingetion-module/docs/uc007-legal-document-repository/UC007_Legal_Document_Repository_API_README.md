# UC007 - Legal Document Repository API Documentation

## Overview

The Legal Document Repository (UC007) provides a comprehensive document management system for legal cases with version control, access control, and entity linkage capabilities. This API allows users to upload, manage, and retrieve legal documents with proper security and audit trails.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL and Versioning](#base-url-and-versioning)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Examples](#requestresponse-examples)
5. [Error Handling](#error-handling)
6. [File Upload Guidelines](#file-upload-guidelines)
7. [Access Control](#access-control)
8. [Version Control](#version-control)
9. [Testing with Postman](#testing-with-postman)

## Authentication

All API endpoints require Bearer token authentication:

```http
Authorization: Bearer <your-jwt-token>
```

## Base URL and Versioning

- **Base URL**: `http://localhost:3000`
- **API Version**: `v1`
- **Full Base Path**: `http://localhost:3000/api/v1/legal/documents`

## API Endpoints

### 1. Document Upload

#### Upload Document

```http
POST /api/v1/legal/documents/upload
Content-Type: multipart/form-data
```

**Form Data Parameters:**

- `file` (required): The document file to upload
- `linkedEntityType` (required): Type of entity (Borrower, Loan Account, Case ID)
- `linkedEntityId` (required): ID of the entity
- `documentName` (required): Name/title of the document
- `documentTypeId` (required): ID of the document type
- `accessPermissions` (optional): Array of access permissions
- `confidentialFlag` (optional): Whether document is confidential
- `isPublic` (optional): Whether document is public
- `caseDocumentType` (optional): Specific type of case document
- `hearingDate` (optional): Date of hearing
- `documentDate` (optional): Date when document was created
- `remarksTags` (optional): Array of tags/remarks

**Success Response (201):**

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "documentId": "LDR-20250721-0001",
    "linkedEntityType": "Case ID",
    "linkedEntityId": "case-uuid-123",
    "documentName": "Affidavit of Service",
    "documentTypeId": "type-uuid-456",
    "documentTypeName": "Legal Document",
    "documentCategory": "Legal Notice",
    "filePath": "/uploads/documents/2025/07/21/LDR-20250721-0001_affidavit.pdf",
    "fileName": "affidavit.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "storageProvider": "local",
    "confidentialFlag": false,
    "isPublic": false,
    "versionNumber": 1,
    "parentDocumentId": null,
    "documentStatus": "Active",
    "documentHash": "sha256:abc123def456",
    "caseDocumentType": "Affidavit",
    "hearingDate": "2025-08-15",
    "documentDate": "2025-07-21",
    "accessPermissions": ["Legal Officer", "Admin"],
    "lastAccessedAt": null,
    "lastAccessedBy": null,
    "remarksTags": ["urgent", "confidential", "evidence"],
    "createdAt": "2025-07-21T10:00:00Z",
    "updatedAt": "2025-07-21T10:00:00Z",
    "createdBy": "Legal Officer",
    "updatedBy": null,
    "uploadDate": "2025-07-21T10:00:00Z"
  }
}
```

#### Upload Document for Legal Case

```http
POST /api/v1/legal/documents/legal-case/{caseId}/upload
Content-Type: multipart/form-data
```

**Path Parameters:**

- `caseId`: UUID of the legal case

**Form Data Parameters:** Same as above, except `linkedEntityType` and `linkedEntityId` are automatically set to "Case ID" and the provided `caseId`.

### 2. Document Retrieval

#### Get Documents by Entity

```http
GET /api/v1/legal/documents?entityType={type}&entityId={id}&page={page}&limit={limit}
```

**Query Parameters:**

- `entityType` (required): Type of entity (Borrower, Loan Account, Case ID)
- `entityId` (required): ID of the entity
- `page` (optional): Page number (default: 1)
- `limit` (optional): Documents per page (default: 10)
- `documentType` (optional): Filter by document type
- `confidentialOnly` (optional): Filter confidential documents only
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order (asc/desc, default: desc)

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "documentId": "LDR-20250721-0001",
      "linkedEntityType": "Case ID",
      "linkedEntityId": "case-uuid-123",
      "documentName": "Affidavit of Service",
      "documentTypeId": "type-uuid-456",
      "documentTypeName": "Legal Document",
      "documentCategory": "Legal Notice",
      "filePath": "/uploads/documents/2025/07/21/LDR-20250721-0001_affidavit.pdf",
      "fileName": "affidavit.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "storageProvider": "local",
      "confidentialFlag": false,
      "isPublic": false,
      "versionNumber": 1,
      "parentDocumentId": null,
      "documentStatus": "Active",
      "documentHash": "sha256:abc123def456",
      "caseDocumentType": "Affidavit",
      "hearingDate": "2025-08-15",
      "documentDate": "2025-07-21",
      "accessPermissions": ["Legal Officer", "Admin"],
      "lastAccessedAt": "2025-07-21T11:00:00Z",
      "lastAccessedBy": "Legal Officer",
      "remarksTags": ["urgent", "confidential", "evidence"],
      "createdAt": "2025-07-21T10:00:00Z",
      "updatedAt": "2025-07-21T10:00:00Z",
      "createdBy": "Legal Officer",
      "updatedBy": null,
      "uploadDate": "2025-07-21T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Get Document by ID

```http
GET /api/v1/legal/documents/{id}
```

**Path Parameters:**

- `id`: Document UUID

**Success Response (200):** Same as single document object above.

#### Get All Documents for Legal Case

```http
GET /api/v1/legal/documents/legal-case/{caseId}?page={page}&limit={limit}
```

**Path Parameters:**

- `caseId`: Legal case UUID

**Query Parameters:** Same as "Get Documents by Entity"

**Success Response (200):** Same as documents array with pagination.

### 3. Document Download

#### Download Document

```http
GET /api/v1/legal/documents/{id}/download
```

**Path Parameters:**

- `id`: Document UUID

**Success Response (200):**

- **Content-Type**: Based on file type (application/pdf, application/msword, etc.)
- **Content-Disposition**: attachment; filename="filename.ext"
- **Body**: Binary file content

### 4. Document Version Control

#### Get Document Versions

```http
GET /api/v1/legal/documents/{id}/versions
```

**Path Parameters:**

- `id`: Document UUID

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "documentId": "LDR-20250721-0001",
      "versionNumber": 2,
      "fileName": "affidavit_v2.pdf",
      "fileSize": 1150000,
      "mimeType": "application/pdf",
      "documentHash": "sha256:xyz789abc123",
      "createdAt": "2025-07-21T15:00:00Z",
      "createdBy": "Legal Officer",
      "remarks": "Updated with additional witness statements"
    },
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "documentId": "LDR-20250721-0001",
      "versionNumber": 1,
      "fileName": "affidavit.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "documentHash": "sha256:abc123def456",
      "createdAt": "2025-07-21T10:00:00Z",
      "createdBy": "Legal Officer",
      "remarks": "Initial version"
    }
  ]
}
```

### 5. Document Management

#### Update Document Metadata

```http
PUT /api/v1/legal/documents/{id}
Content-Type: application/json
```

**Path Parameters:**

- `id`: Document UUID

**Request Body:**

```json
{
  "documentName": "Updated Affidavit of Service",
  "accessPermissions": ["Legal Officer", "Admin", "Compliance"],
  "confidentialFlag": true,
  "caseDocumentType": "Affidavit",
  "hearingDate": "2025-08-20",
  "documentDate": "2025-07-22",
  "remarksTags": ["updated", "urgent", "confidential", "evidence"]
}
```

**Success Response (200):** Same as single document object with updated fields.

#### Delete Document

```http
DELETE /api/v1/legal/documents/{id}
```

**Path Parameters:**

- `id`: Document UUID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "documentId": "LDR-20250721-0001",
    "deletedAt": "2025-07-21T17:00:00Z",
    "deletedBy": "Legal Officer"
  }
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "documentName should not be empty",
    "accessPermissions must contain at least 1 elements"
  ],
  "error": "Bad Request"
}
```

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Access denied. Insufficient permissions to access this document.",
  "error": "Forbidden"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Document not found",
  "error": "Not Found"
}
```

#### 413 Payload Too Large

```json
{
  "statusCode": 413,
  "message": "File size exceeds maximum limit of 10MB",
  "error": "Payload Too Large"
}
```

#### 415 Unsupported Media Type

```json
{
  "statusCode": 415,
  "message": "Unsupported file type. Allowed types: PDF, DOCX, JPG, PNG, XLSX",
  "error": "Unsupported Media Type"
}
```

#### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## File Upload Guidelines

### Supported File Types

- **PDF**: `.pdf`
- **Microsoft Word**: `.docx`
- **Images**: `.jpg`, `.jpeg`, `.png`
- **Microsoft Excel**: `.xlsx`

### File Size Limits

- **Maximum file size**: 10MB (configurable)
- **Minimum file size**: 1KB

### File Naming Convention

Documents are automatically renamed using the following pattern:

```
LDR-YYYYMMDD-Sequence_original_filename.ext
```

Example: `LDR-20250721-0001_affidavit.pdf`

### Storage Structure

```
uploads/
└── documents/
    └── YYYY/
        └── MM/
            └── DD/
                └── LDR-YYYYMMDD-Sequence_filename.ext
```

## Access Control

### Role-Based Access Control (RBAC)

The system supports the following roles with specific permissions:

#### Legal Officer

- **Full Access**: Can view, upload, update, and delete all documents
- **Permissions**: All document operations
- **Restrictions**: None

#### Admin

- **Full Access**: Can view, upload, update, and delete all documents
- **Permissions**: All document operations
- **Restrictions**: None

#### Compliance

- **Limited Access**: Can view and download documents based on access permissions
- **Permissions**: Read access to assigned documents
- **Restrictions**: Cannot delete documents

#### Lawyer

- **Case-Specific Access**: Can view and download documents for assigned cases
- **Permissions**: Read access to case documents
- **Restrictions**: Cannot upload or delete documents

### Document-Level Permissions

Each document can have specific access permissions:

- **Access Permissions**: Array of roles that can access the document
- **Confidential Flag**: Restricts access to authorized personnel only
- **Public Flag**: Makes document accessible to all authenticated users

## Version Control

### Version Management

- **Automatic Versioning**: New uploads create new versions
- **Version Numbering**: Sequential numbering (1, 2, 3, etc.)
- **Version History**: Complete audit trail of all versions
- **Parent-Child Relationship**: Links versions to original document

### Version Operations

- **View Versions**: Get all versions of a document
- **Download Specific Version**: Download any version by version number
- **Version Metadata**: Track who created each version and when

## Testing with Postman

### Import Collection

1. Open Postman
2. Click "Import" button
3. Select the `UC007_Legal_Document_Repository.postman_collection.json` file
4. Import the environment file `UC007_Legal_Document_Repository_Environment.postman_environment.json`

### Environment Setup

1. Create a new environment in Postman
2. Add the following variables:
   - `base_url`: `http://localhost:3000`
   - `auth_token`: Your JWT token
   - `case_id`: Sample case ID for testing
   - `document_id`: Sample document ID for testing
   - `document_type_id`: Sample document type ID

### Testing Workflow

1. **Authentication**: Ensure you have a valid JWT token
2. **Upload Document**: Test document upload with various file types
3. **Retrieve Documents**: Test document listing and filtering
4. **Download Document**: Test file download functionality
5. **Update Metadata**: Test document metadata updates
6. **Version Control**: Test version management features
7. **Delete Document**: Test document deletion

### Sample Test Data

#### Sample Case ID

```
a1b2c3d4-e5f6-7890-1234-567890abcdef
```

#### Sample Document Type ID

```
c3d4e5f6-g7h8-9012-3456-789012345678
```

#### Sample Document Types

- Affidavit
- Court Order
- Evidence
- Witness Statement
- Expert Report
- Medical Report
- Financial Statement
- Property Document
- Legal Notice
- Reply Notice
- Counter Affidavit
- Interim Order
- Final Order
- Judgment
- Settlement Agreement
- Compromise Deed
- Power of Attorney
- Authorization Letter
- Identity Proof
- Address Proof
- Income Proof
- Bank Statement
- Loan Agreement
- Security Document
- Other

## API Rate Limits

- **Upload Requests**: 10 requests per minute per user
- **Download Requests**: 50 requests per minute per user
- **Metadata Requests**: 100 requests per minute per user

## Security Considerations

1. **File Validation**: All uploaded files are scanned for malware
2. **Access Logging**: All document access is logged for audit purposes
3. **Encryption**: Sensitive documents are encrypted at rest
4. **Token Expiration**: JWT tokens expire after 24 hours
5. **Role Validation**: Server-side validation of user roles and permissions

## Troubleshooting

### Common Issues

#### File Upload Fails

- Check file size (must be < 10MB)
- Verify file type is supported
- Ensure authentication token is valid

#### Access Denied

- Verify user has appropriate role
- Check document access permissions
- Ensure user is authenticated

#### Document Not Found

- Verify document ID is correct
- Check if document was deleted
- Ensure user has access to the document

### Support

For technical support or questions about the Legal Document Repository API, please contact the development team or refer to the system documentation.

---

**Last Updated**: January 21, 2025  
**API Version**: v1  
**Collection Version**: 1.0.0
