# UC003 Legal Case Management - Complete API Documentation

## Overview

This comprehensive API documentation covers all Legal Case Management services including CRUD operations, lawyer assignment, document management, status tracking, timeline management, and notifications.

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Request/Response Formats](#requestresponse-formats)
- [Postman Collection](#postman-collection)
- [Sample Data](#sample-data)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## API Endpoints

### Base URL

```
http://localhost:3001/api/v1
```

### 1. Legal Case CRUD Operations

#### Create Legal Case
- **POST** `/legal-cases`
- **Description**: Create a new legal case
- **Authentication**: Required (Bearer Token)

**Request Body:**
```json
{
  "loanAccountNumber": "52222222142",
  "caseType": "Civil",
  "courtName": "Mumbai Sessions Court",
  "caseFiledDate": "2025-07-21",
  "lawyerAssignedId": "lawyer-uuid",
  "filingJurisdiction": "Mumbai, Maharashtra",
  "currentStatus": "Filed",
  "nextHearingDate": "2025-08-15",
  "lastHearingOutcome": "Case admitted for hearing",
  "recoveryActionLinked": "None",
  "remarks": "Standard civil case for loan recovery"
}
```

**Response (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "caseId": "LC-20250721-001",
  "loanAccountNumber": "52222222142",
  "borrowerName": "John Doe",
  "caseType": "Civil",
  "courtName": "Mumbai Sessions Court",
  "caseFiledDate": "2025-07-21",
  "lawyerAssignedId": "lawyer-uuid",
  "filingJurisdiction": "Mumbai, Maharashtra",
  "currentStatus": "Filed",
  "nextHearingDate": "2025-08-15",
  "lastHearingOutcome": "Case admitted for hearing",
  "recoveryActionLinked": "None",
  "remarks": "Standard civil case for loan recovery",
  "createdAt": "2025-07-21T10:30:00.000Z",
  "updatedAt": "2025-07-21T10:30:00.000Z"
}
```

#### Get All Legal Cases
- **GET** `/legal-cases`
- **Description**: Retrieve all legal cases with filtering and pagination
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `caseType` (optional): Filter by case type
  - `currentStatus` (optional): Filter by current status
  - `lawyerAssignedId` (optional): Filter by assigned lawyer ID
  - `loanAccountNumber` (optional): Filter by loan account number
  - `borrowerName` (optional): Filter by borrower name

#### Get Legal Case by ID
- **GET** `/legal-cases/{id}`
- **Description**: Get a specific legal case by ID

#### Update Legal Case
- **PUT** `/legal-cases/{id}`
- **Description**: Update an existing legal case

#### Delete Legal Case
- **DELETE** `/legal-cases/{id}`
- **Description**: Delete a legal case

#### Get Cases by Account
- **GET** `/legal-cases/account/{accountNumber}`
- **Description**: Get all cases for a specific loan account

#### Get Cases by Lawyer
- **GET** `/legal-cases/lawyer/{lawyerId}`
- **Description**: Get all cases assigned to a specific lawyer

### 2. Lawyer Management & Assignment

#### Create Lawyer
- **POST** `/legal/lawyers`
- **Description**: Create a new lawyer record

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@lawfirm.com",
  "phone": "+91-9876543210",
  "barNumber": "BAR123456",
  "specialization": "Civil Law",
  "experience": 5,
  "lawyerType": "Internal",
  "maxCases": 10,
  "officeLocation": "Mumbai, Maharashtra",
  "jurisdiction": "Mumbai Sessions Court, Bombay High Court"
}
```

#### Get All Lawyers
- **GET** `/legal/lawyers`
- **Description**: Retrieve all lawyers with filtering and pagination
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `specialization` (optional): Filter by specialization
  - `isAvailable` (optional): Filter by availability
  - `lawyerType` (optional): Filter by lawyer type
  - `jurisdiction` (optional): Filter by jurisdiction

#### Get Lawyer by ID
- **GET** `/legal/lawyers/{id}`
- **Description**: Get a specific lawyer by ID

#### Update Lawyer
- **PUT** `/legal/lawyers/{id}`
- **Description**: Update an existing lawyer

#### Delete Lawyer
- **DELETE** `/legal/lawyers/{id}`
- **Description**: Delete a lawyer

#### Get Available Lawyers
- **GET** `/legal/lawyers/available`
- **Description**: Get available lawyers for case assignment
- **Query Parameters**:
  - `specialization` (optional): Filter by specialization
  - `jurisdiction` (optional): Filter by jurisdiction
  - `limit` (optional): Maximum number of results

#### Get Lawyer Workload Stats
- **GET** `/legal/lawyers/{id}/workload-stats`
- **Description**: Get workload statistics for a specific lawyer

#### Assign Lawyer to Case
- **POST** `/legal/lawyers/assign`
- **Description**: Assign a lawyer to a case with workload balancing

**Request Body:**
```json
{
  "caseId": "case-uuid",
  "caseType": "Civil",
  "jurisdiction": "Mumbai",
  "specialization": "Civil Law",
  "priority": "High",
  "excludeLawyerIds": []
}
```

#### Reassign Lawyer to Case
- **PUT** `/legal/lawyers/{lawyerId}/reassign/{caseId}`
- **Description**: Reassign a case to a different lawyer

#### Get Lawyer Assignments
- **GET** `/legal/lawyers/{lawyerId}/assignments`
- **Description**: Get all assignments for a specific lawyer

### 3. Status Management & Timeline

#### Update Case Status
- **PUT** `/legal/lawyers/cases/{caseId}/status`
- **Description**: Update case status with workflow validation

**Request Body:**
```json
{
  "newStatus": "Under Trial",
  "reason": "Case proceedings have begun",
  "nextHearingDate": "2025-08-15",
  "lastHearingOutcome": "Case admitted for trial",
  "outcomeSummary": "Case is now under trial proceedings"
}
```

#### Get Case Timeline
- **GET** `/legal/lawyers/cases/{caseId}/timeline`
- **Description**: Get timeline events for a specific case

#### Get Timeline Statistics
- **GET** `/legal/lawyers/timeline/statistics`
- **Description**: Get comprehensive timeline statistics

#### Add Timeline Event
- **POST** `/legal/timeline/events`
- **Description**: Add a new timeline event

**Request Body:**
```json
{
  "caseId": "case-uuid",
  "eventType": "Hearing",
  "eventTitle": "Court Hearing Scheduled",
  "eventDescription": "Next hearing scheduled for case proceedings",
  "eventDate": "2025-08-15T10:00:00Z",
  "isMilestone": true,
  "tags": ["hearing", "court"],
  "eventData": {
    "hearingType": "Regular",
    "courtRoom": "Room 101"
  }
}
```

### 4. Document Management

#### Upload Document
- **POST** `/documents/upload`
- **Description**: Upload and store a document
- **Content-Type**: `multipart/form-data`

**Form Data:**
- `file`: Document file (PDF, DOCX, JPG, PNG)
- `linkedEntityType`: "Legal Case"
- `linkedEntityId`: Case UUID
- `documentName`: Document title
- `documentTypeId`: Document type UUID
- `caseDocumentType`: "Affidavit", "Summons", etc.
- `confidentialFlag`: true/false
- `remarks`: Additional notes

#### Get Document by ID
- **GET** `/documents/{id}`
- **Description**: Get document details by ID

#### Get All Documents
- **GET** `/documents`
- **Description**: Get all documents with filtering and pagination
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `linkedEntityType` (optional): Filter by entity type
  - `documentType` (optional): Filter by document type
  - `confidentialFlag` (optional): Filter by confidentiality

#### Get Legal Case Documents
- **GET** `/documents/legal-case/{caseId}`
- **Description**: Get all documents for a specific legal case
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `caseDocumentType` (optional): Filter by case document type

#### Download Document
- **GET** `/documents/{id}/download`
- **Description**: Download a document file

#### Update Document
- **PUT** `/documents/{id}`
- **Description**: Update document metadata

#### Delete Document
- **DELETE** `/documents/{id}`
- **Description**: Delete a document

#### Get Document Versions
- **GET** `/documents/{id}/versions`
- **Description**: Get all versions of a document

#### Search Documents
- **GET** `/documents/search`
- **Description**: Search documents by query
- **Query Parameters**:
  - `query`: Search term
  - `page` (optional): Page number
  - `limit` (optional): Items per page

### 5. Notifications

#### Send Notification
- **POST** `/legal/notifications/send`
- **Description**: Send a notification to a recipient

**Request Body:**
```json
{
  "recipientId": "lawyer-uuid",
  "recipientType": "lawyer",
  "notificationType": "lawyer_assigned",
  "title": "New Case Assignment",
  "message": "You have been assigned to case LC-20250721-001 for John Doe",
  "priority": "high",
  "relatedEntityType": "Legal Case",
  "relatedEntityId": "case-uuid",
  "actionUrl": "/legal-cases/case-uuid"
}
```

#### Get Notifications
- **GET** `/legal/notifications`
- **Description**: Get notifications with filtering
- **Query Parameters**:
  - `recipientId` (optional): Filter by recipient ID
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `isRead` (optional): Filter by read status
  - `priority` (optional): Filter by priority

#### Mark Notification as Read
- **PUT** `/legal/notifications/{id}/read`
- **Description**: Mark a notification as read

#### Get Notification Statistics
- **GET** `/legal/notifications/statistics`
- **Description**: Get notification statistics

### 6. Pre-Legal Notice Integration

#### Create Pre-Legal Notice
- **POST** `/legal/pre-legal-notices`
- **Description**: Create a new pre-legal notice

#### Generate Notice Preview
- **POST** `/legal/pre-legal-notices/preview`
- **Description**: Generate a preview of the notice without saving

#### Get Pre-Legal Notices
- **GET** `/legal/pre-legal-notices`
- **Description**: Get pre-legal notices with filtering

## Authentication

All endpoints require Bearer token authentication:

```bash
Authorization: Bearer <your_jwt_token>
```

## Request/Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-07-21T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "caseType",
        "message": "Case type is required"
      }
    ]
  },
  "timestamp": "2025-07-21T10:30:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-07-21T10:30:00.000Z"
}
```

## Postman Collection

### Collection Files
- **Main Collection**: `UC003_Legal_Case_Management_Complete.postman_collection.json`
- **Environment**: `UC003_Legal_Case_Management_Environment.postman_environment.json`

### Environment Variables
- `base_url`: http://localhost:3001
- `api_prefix`: api/v1
- `auth_token`: Your JWT token
- `case_id`: Case UUID
- `lawyer_id`: Lawyer UUID
- `document_id`: Document UUID
- And many more pre-configured variables...

### Collection Structure
1. **Legal Case CRUD Operations** (7 endpoints)
2. **Lawyer Management & Assignment** (10 endpoints)
3. **Status Management & Timeline** (4 endpoints)
4. **Document Management** (9 endpoints)
5. **Notifications** (4 endpoints)
6. **Pre-Legal Notice Integration** (3 endpoints)

## Sample Data

### Legal Case Sample
```json
{
  "loanAccountNumber": "52222222142",
  "caseType": "Civil",
  "courtName": "Mumbai Sessions Court",
  "caseFiledDate": "2025-07-21",
  "filingJurisdiction": "Mumbai, Maharashtra",
  "currentStatus": "Filed"
}
```

### Lawyer Sample
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@lawfirm.com",
  "phone": "+91-9876543210",
  "specialization": "Civil Law",
  "experience": 5,
  "maxCases": 10
}
```

### Document Sample
```json
{
  "documentName": "Case Affidavit",
  "caseDocumentType": "Affidavit",
  "confidentialFlag": false,
  "remarks": "Initial case affidavit"
}
```

## Error Handling

### Status Codes
| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error - Server error |

### Common Error Scenarios
- **Validation Errors**: Missing required fields, invalid data types
- **Authentication Errors**: Invalid or expired tokens
- **Authorization Errors**: Insufficient permissions
- **Resource Not Found**: Invalid IDs or non-existent resources
- **Business Logic Errors**: Invalid status transitions, assignment conflicts

## Rate Limiting

- **Standard Endpoints**: 100 requests per minute
- **Heavy Operations**: 10 requests per minute
- **File Uploads**: 5 requests per minute
- **Search Operations**: 50 requests per minute

## Testing

### Using Postman

1. Import the collection: `UC003_Legal_Case_Management_Complete.postman_collection.json`
2. Import the environment: `UC003_Legal_Case_Management_Environment.postman_environment.json`
3. Set your authentication token in the environment variables
4. Run the requests in order for best results

### Test Scenarios

1. **Create Case Flow**:
   - Create a lawyer
   - Create a legal case
   - Assign lawyer to case
   - Update case status
   - Add timeline events

2. **Document Management Flow**:
   - Upload document
   - Get document details
   - Download document
   - Update document metadata
   - Get document versions

3. **Notification Flow**:
   - Send notification
   - Get notifications
   - Mark as read
   - Get statistics

## Support

For technical support or questions about the API, please contact:
- **Email**: support@legal-system.com
- **Documentation**: https://docs.legal-system.com
- **Status Page**: https://status.legal-system.com

## Changelog

### Version 1.0.0 (2025-07-21)
- Initial release of Legal Case Management APIs
- Complete CRUD operations for all entities
- Advanced filtering and search capabilities
- Comprehensive Postman collection
- Full API documentation

## License

This API documentation is proprietary and confidential. Unauthorized distribution is prohibited.
