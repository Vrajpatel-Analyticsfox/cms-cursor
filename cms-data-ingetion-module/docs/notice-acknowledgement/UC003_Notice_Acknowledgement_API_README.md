# UC003 - Notice Acknowledgement Management API Documentation

## Overview

This Postman collection provides comprehensive testing capabilities for the Notice Acknowledgement Management system (UC003) with dual flow support for creating acknowledgements with and without document uploads.

## Collection Structure

### 📁 Notice Acknowledgements

- **1. Create Acknowledgement (Without Document)** - JSON-based creation
- **2. Create Acknowledgement (With Document)** - Multipart form data with file upload
- **3. Get All Acknowledgements** - Paginated list with filtering
- **4. Get Acknowledgement by ID** - Retrieve specific acknowledgement
- **5. Update Acknowledgement** - Modify existing acknowledgement
- **6. Delete Acknowledgement** - Remove acknowledgement record

### 📁 File Management

- **7. Upload Proof Document** - Upload proof for existing acknowledgement
- **8. Download Proof Document** - Download proof file
- **9. Delete Proof Document** - Remove proof file

### 📁 Statistics & Reports

- **10. Get Acknowledgement Statistics** - Dashboard statistics
- **11. Get File Upload Statistics** - File management statistics

### 📁 General File Management

- **12. Generic File Upload** - Upload files for any document type
- **13. Download File by Path** - Download any file by path
- **14. Get File Statistics** - Comprehensive file statistics

## Environment Variables

### Required Variables

| Variable             | Description              | Example Value                          |
| -------------------- | ------------------------ | -------------------------------------- |
| `base_url`           | API base URL             | `http://localhost:3000`                |
| `auth_token`         | JWT authentication token | `eyJhbGciOiJIUzI1NiIs...`              |
| `notice_id`          | UUID of legal notice     | `a1b2c3d4-e5f6-7890-1234-567890abcdef` |
| `acknowledgement_id` | UUID of acknowledgement  | `b1c2d3e4-f5a6-7890-1234-567890abcdef` |

### File Path Variables

| Variable                | Description                     | Example Value                                        |
| ----------------------- | ------------------------------- | ---------------------------------------------------- |
| `proof_document_path`   | Path to proof document          | `C:\Users\User\Documents\sample_proof.pdf`           |
| `generic_document_path` | Path to generic document        | `C:\Users\User\Documents\sample_document.pdf`        |
| `file_path`             | Relative file path for download | `acknowledgements/2025/01/21/ACKN-20250121-0001.pdf` |

### Data Variables

| Variable                   | Description               | Example Value                   |
| -------------------------- | ------------------------- | ------------------------------- |
| `loan_account_number`      | Loan account number       | `LN4567890`                     |
| `borrower_name`            | Borrower name             | `Rajiv Menon`                   |
| `notice_type`              | Type of notice            | `Pre-Legal`                     |
| `acknowledged_by`          | Who acknowledged          | `Family Member`                 |
| `relationship_to_borrower` | Relationship              | `Spouse`                        |
| `acknowledgement_date`     | Acknowledgement date      | `2025-01-21T16:30:00Z`          |
| `acknowledgement_mode`     | Mode of acknowledgement   | `In Person`                     |
| `remarks`                  | Additional remarks        | `Notice acknowledged by spouse` |
| `captured_by`              | Who captured the data     | `Field Executive - Mumbai Team` |
| `geo_location`             | Geographic coordinates    | `19.0760,72.8777`               |
| `acknowledgement_status`   | Status of acknowledgement | `Acknowledged`                  |

### Pagination Variables

| Variable | Description    | Example Value |
| -------- | -------------- | ------------- |
| `page`   | Page number    | `1`           |
| `limit`  | Items per page | `10`          |

### Filter Variables

| Variable                 | Description               | Example Value   |
| ------------------------ | ------------------------- | --------------- |
| `filter_status`          | Filter by status          | `Acknowledged`  |
| `filter_mode`            | Filter by mode            | `In Person`     |
| `filter_acknowledged_by` | Filter by acknowledged by | `Family Member` |
| `date_from`              | Start date filter         | `2025-01-01`    |
| `date_to`                | End date filter           | `2025-01-31`    |

## API Endpoints

### 1. Create Acknowledgement (Without Document)

```
POST /legal/notice-acknowledgements
Content-Type: application/json
```

**Request Body:**

```json
{
  "noticeId": "{{notice_id}}",
  "acknowledgedBy": "Family Member",
  "relationshipToBorrower": "Spouse",
  "acknowledgementDate": "2025-01-21T16:30:00Z",
  "acknowledgementMode": "In Person",
  "remarks": "Notice acknowledged by spouse in presence of security guard",
  "capturedBy": "Field Executive - Mumbai Team",
  "geoLocation": "19.0760,72.8777"
}
```

**Response:**

```json
{
  "id": "b1c2d3e4-f5a6-7890-1234-567890abcdef",
  "acknowledgementId": "ACKN-20250121-0001",
  "noticeId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "loanAccountNumber": "LN4567890",
  "borrowerName": "Rajiv Menon",
  "noticeType": "Pre-Legal",
  "acknowledgedBy": "Family Member",
  "relationshipToBorrower": "Spouse",
  "acknowledgementDate": "2025-01-21T16:30:00Z",
  "acknowledgementMode": "In Person",
  "proofOfAcknowledgement": null,
  "remarks": "Notice acknowledged by spouse in presence of security guard",
  "capturedBy": "Field Executive - Mumbai Team",
  "geoLocation": "19.0760,72.8777",
  "acknowledgementStatus": "Acknowledged",
  "createdAt": "2025-01-21T10:00:00Z",
  "updatedAt": "2025-01-21T10:00:00Z",
  "createdBy": "system",
  "updatedBy": null
}
```

### 2. Create Acknowledgement (With Document)

```
POST /legal/notice-acknowledgements/with-document
Content-Type: multipart/form-data
```

**Form Data:**

- `noticeId`: `{{notice_id}}`
- `acknowledgedBy`: `Family Member`
- `relationshipToBorrower`: `Spouse`
- `acknowledgementDate`: `2025-01-21T16:30:00Z`
- `acknowledgementMode`: `In Person`
- `remarks`: `Notice acknowledged by spouse with proof document`
- `capturedBy`: `Field Executive - Mumbai Team`
- `geoLocation`: `19.0760,72.8777`
- `file`: `[Binary file data]`

**Response:** Same as above but with `proofOfAcknowledgement` populated.

### 3. Get All Acknowledgements

```
GET /legal/notice-acknowledgements?page=1&limit=10
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by acknowledgement status
- `mode`: Filter by acknowledgement mode
- `acknowledgedBy`: Filter by who acknowledged
- `dateFrom`: Start date filter
- `dateTo`: End date filter

**Response:**

```json
{
  "data": [
    {
      "id": "b1c2d3e4-f5a6-7890-1234-567890abcdef",
      "acknowledgementId": "ACKN-20250121-0001",
      "noticeId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "loanAccountNumber": "LN4567890",
      "borrowerName": "Rajiv Menon",
      "noticeType": "Pre-Legal",
      "acknowledgedBy": "Family Member",
      "relationshipToBorrower": "Spouse",
      "acknowledgementDate": "2025-01-21T16:30:00Z",
      "acknowledgementMode": "In Person",
      "proofOfAcknowledgement": null,
      "remarks": "Notice acknowledged by spouse in presence of security guard",
      "capturedBy": "Field Executive - Mumbai Team",
      "geoLocation": "19.0760,72.8777",
      "acknowledgementStatus": "Acknowledged",
      "createdAt": "2025-01-21T10:00:00Z",
      "updatedAt": "2025-01-21T10:00:00Z",
      "createdBy": "system",
      "updatedBy": null
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

### 4. Get Acknowledgement by ID

```
GET /legal/notice-acknowledgements/{{acknowledgement_id}}
```

**Response:** Single acknowledgement object (same structure as above).

### 5. Update Acknowledgement

```
PUT /legal/notice-acknowledgements/{{acknowledgement_id}}
Content-Type: application/json
```

**Request Body:**

```json
{
  "acknowledgedBy": "Borrower",
  "relationshipToBorrower": "Self",
  "acknowledgementDate": "2025-01-21T17:00:00Z",
  "acknowledgementMode": "Courier Receipt",
  "remarks": "Updated: Borrower personally acknowledged the notice",
  "geoLocation": "19.0760,72.8777",
  "acknowledgementStatus": "Acknowledged"
}
```

**Response:** Updated acknowledgement object.

### 6. Delete Acknowledgement

```
DELETE /legal/notice-acknowledgements/{{acknowledgement_id}}
```

**Response:** `204 No Content`

## File Management Endpoints

### 7. Upload Proof Document

```
POST /legal/notice-acknowledgements/{{acknowledgement_id}}/upload-proof
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: `[Binary file data]`

**Response:**

```json
{
  "success": true,
  "filePath": "/uploads/acknowledgements/2025/01/21/ACKN-20250121-0001_1641234567890_a1b2c3d4.pdf",
  "fileName": "ACKN-20250121-0001_1641234567890_a1b2c3d4.pdf",
  "fileSize": 1024000
}
```

### 8. Download Proof Document

```
GET /legal/notice-acknowledgements/{{acknowledgement_id}}/proof
```

**Response:** Binary file content with appropriate headers.

### 9. Delete Proof Document

```
DELETE /legal/notice-acknowledgements/{{acknowledgement_id}}/proof
```

**Response:**

```json
{
  "success": true,
  "message": "Proof file deleted successfully"
}
```

## Statistics Endpoints

### 10. Get Acknowledgement Statistics

```
GET /legal/notice-acknowledgements/statistics
```

**Response:**

```json
{
  "totalAcknowledgements": 150,
  "byStatus": [
    {
      "status": "Acknowledged",
      "count": 120
    },
    {
      "status": "Refused",
      "count": 20
    },
    {
      "status": "Pending Verification",
      "count": 10
    }
  ],
  "byMode": [
    {
      "mode": "In Person",
      "count": 80
    },
    {
      "mode": "Courier Receipt",
      "count": 40
    },
    {
      "mode": "Email",
      "count": 20
    },
    {
      "mode": "SMS",
      "count": 10
    }
  ],
  "byAcknowledgedBy": [
    {
      "acknowledgedBy": "Borrower",
      "count": 90
    },
    {
      "acknowledgedBy": "Family Member",
      "count": 45
    },
    {
      "acknowledgedBy": "Lawyer",
      "count": 15
    }
  ],
  "generatedAt": "2025-01-21T12:00:00Z"
}
```

### 11. Get File Upload Statistics

```
GET /legal/notice-acknowledgements/file-upload/statistics?documentType=acknowledgements
```

**Response:**

```json
{
  "totalFiles": 75,
  "totalSize": 52428800,
  "fileTypeDistribution": {
    "PDF": 50,
    "JPG": 15,
    "PNG": 10
  },
  "folderStructure": {
    "acknowledgements/2025/01/21": 25,
    "acknowledgements/2025/01/20": 30,
    "acknowledgements/2025/01/19": 20
  },
  "oldestFile": "2025-01-15T10:30:00Z",
  "newestFile": "2025-01-21T16:45:00Z"
}
```

## General File Management Endpoints

### 12. Generic File Upload

```
POST /legal/files/upload/{{document_type}}/{{entity_id}}?subFolder={{sub_folder}}
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: `[Binary file data]`

**Response:**

```json
{
  "success": true,
  "filePath": "/uploads/legal-cases/2025/01/21/contracts/case123_1641234567890_a1b2c3d4.pdf",
  "fileName": "case123_1641234567890_a1b2c3d4.pdf",
  "fileSize": 2048000
}
```

### 13. Download File by Path

```
GET /legal/files/download/{{file_path}}
```

**Response:** Binary file content with appropriate headers.

### 14. Get File Statistics

```
GET /legal/files/statistics?documentType=acknowledgements
```

**Response:**

```json
{
  "totalFiles": 150,
  "totalSize": 104857600,
  "fileTypeDistribution": {
    "PDF": 100,
    "JPG": 30,
    "PNG": 20
  },
  "folderStructure": {
    "acknowledgements/2025/01/21": 50,
    "acknowledgements/2025/01/20": 60,
    "acknowledgements/2025/01/19": 40
  },
  "oldestFile": "2025-01-15T10:30:00Z",
  "newestFile": "2025-01-21T16:45:00Z"
}
```

## Error Responses

### Common Error Codes

- **400 Bad Request**: Invalid input data or file upload error
- **401 Unauthorized**: Invalid or missing authentication token
- **404 Not Found**: Resource not found
- **409 Conflict**: Acknowledgement already exists for this notice
- **413 Payload Too Large**: File size exceeds limit
- **415 Unsupported Media Type**: Invalid file type
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Bad Request - Invalid input data",
  "error": "Bad Request",
  "timestamp": "2025-01-21T12:00:00.000Z",
  "path": "/legal/notice-acknowledgements"
}
```

## File Upload Guidelines

### Supported File Types

- **PDF**: `.pdf`
- **Images**: `.jpg`, `.jpeg`, `.png`
- **Documents**: `.docx`

### File Size Limits

- **Maximum file size**: 10MB
- **Recommended size**: < 5MB for better performance

### File Naming Convention

- **Format**: `{acknowledgementId}_{timestamp}_{uuid}.{ext}`
- **Example**: `ACKN-20250121-0001_1641234567890_a1b2c3d4.pdf`

### Folder Structure

```
uploads/
├── acknowledgements/
│   └── 2025/
│       └── 01/
│           └── 21/
│               └── ACKN-20250121-0001_1641234567890_a1b2c3d4.pdf
├── legal-cases/
│   └── 2025/
│       └── 01/
│           └── 21/
│               └── contracts/
│                   └── case123_1641234567890_a1b2c3d4.pdf
└── borrowers/
    └── 2025/
        └── 01/
            └── 21/
                └── documents/
                    └── borrower123_1641234567890_a1b2c3d4.pdf
```

## Testing Workflows

### 1. Basic Acknowledgement Flow

1. Create acknowledgement without document
2. Upload proof document
3. Get acknowledgement details
4. Update acknowledgement
5. Get statistics

### 2. Complete Document Flow

1. Create acknowledgement with document
2. Download proof document
3. Update acknowledgement
4. Delete proof document
5. Delete acknowledgement

### 3. File Management Flow

1. Upload generic file
2. Download file by path
3. Get file statistics
4. Clean up files

### 4. Statistics and Reporting

1. Get acknowledgement statistics
2. Get file upload statistics
3. Filter acknowledgements
4. Generate reports

## Pre-request Scripts

The collection includes pre-request scripts that:

- Auto-generate acknowledgement IDs if not set
- Set default values for required fields
- Validate environment variables

## Post-response Scripts

The collection includes post-response scripts that:

- Extract IDs from responses for use in subsequent requests
- Set environment variables for chaining requests
- Log response data for debugging

## Environment Setup

### 1. Import Collection

- Import `UC003_Notice_Acknowledgement_Complete.postman_collection.json`

### 2. Import Environment

- Import `UC003_Notice_Acknowledgement_Environment.postman_environment.json`

### 3. Configure Variables

- Update `base_url` to match your server
- Set valid `auth_token`
- Update file paths to match your system
- Set appropriate `notice_id` and `acknowledgement_id`

### 4. Prepare Test Files

- Create sample PDF files for testing
- Ensure file paths in environment variables are correct
- Verify file permissions for upload operations

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify `auth_token` is valid and not expired
2. **File Upload Errors**: Check file paths and file size limits
3. **Validation Errors**: Ensure all required fields are provided
4. **Network Errors**: Verify `base_url` is correct and server is running

### Debug Tips

1. Check environment variables are set correctly
2. Verify file paths exist and are accessible
3. Review request/response logs in Postman console
4. Test with smaller files first
5. Check server logs for detailed error messages

## Support

For technical support or questions about this API collection:

- Review the API documentation
- Check the server logs
- Verify environment configuration
- Test with minimal requests first

## Version History

- **v1.0.0**: Initial release with dual flow support
- Complete CRUD operations
- File management capabilities
- Statistics and reporting
- Comprehensive error handling
