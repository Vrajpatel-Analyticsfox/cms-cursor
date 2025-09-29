# UC008 - Lawyer Allocation Workflow API Documentation

## Overview

This document provides comprehensive API documentation for the Lawyer Allocation Workflow (UC008) following BRD specifications.

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

All endpoints require JWT Bearer token authentication:

```
Authorization: Bearer <your_jwt_token>
```

## Environment Variables

### Required Environment Variables

```bash
# Database Configuration
DATABASE_URL=database_url_here
POSTGRES_PASSWORD=your_postgres_password_here

# Default User Configuration
DEFAULT_USER_SYSTEM=system

# Pagination Configuration
PAGINATION_DEFAULT_PAGE=1
PAGINATION_DEFAULT_LIMIT=10

# Lawyer Allocation Configuration (UC008)
LAWYER_ALLOCATION_DEFAULT_STATUS=Active
LAWYER_ALLOCATION_ACTIVE_STATUS=Active
LAWYER_ALLOCATION_VALID_CASE_STATUSES=Open,Filed
LAWYER_ALLOCATION_ID_PREFIX=LAW
LAWYER_ALLOCATION_SEQUENCE_PADDING=4

# Lawyer Management Configuration
DEFAULT_LAWYER_MAX_CASES=10
DEFAULT_AVAILABLE_LAWYERS_LIMIT=10
LAWYER_CODE_PREFIX=LAW
LAWYER_CODE_SEQUENCE_PADDING=3
```

## API Endpoints

### 1. Lawyer Allocation Management

#### 1.1 Create Lawyer Allocation

**POST** `/legal/lawyer-allocations`

Creates a new lawyer allocation following BRD UC008 specifications.

**Request Body:**

```json
{
  "caseId": "uuid-case-id-here",
  "lawyerId": "uuid-lawyer-id-here",
  "jurisdiction": "Mumbai Sessions Court",
  "lawyerType": "Internal",
  "allocationDate": "2025-09-25",
  "reassignmentFlag": false,
  "reassignmentReason": "Previous lawyer unavailable",
  "remarks": "High priority case requiring experienced lawyer",
  "status": "Active",
  "lawyerAcknowledgement": false,
  "createdBy": "Legal Officer - John Smith"
}
```

**Note:** The following fields are automatically set by the system and should NOT be included in the request:

- `allocationId` - Auto-generated in format LAW-YYYYMMDD-Sequence
- `createdAt` - Set by system

**Response (201 Created):**

```json
{
  "id": "uuid-allocation-id",
  "allocationId": "LAW-20250925-0001",
  "caseId": "uuid-case-id-here",
  "caseCode": "LC-20250925-0001",
  "loanAccountNumber": "92222222145",
  "borrowerName": "John Doe",
  "caseType": "Recovery",
  "jurisdiction": "Mumbai Sessions Court",
  "lawyerType": "Internal",
  "lawyerId": "uuid-lawyer-id-here",
  "lawyerName": "Adv. Rajesh Kumar",
  "allocationDate": "2025-09-25",
  "reassignmentFlag": false,
  "reassignmentReason": null,
  "status": "Active",
  "lawyerAcknowledgement": false,
  "remarks": "High priority case requiring experienced lawyer",
  "createdAt": "2025-09-25T10:30:00.000Z",
  "updatedAt": "2025-09-25T10:30:00.000Z",
  "createdBy": "Legal Officer",
  "updatedBy": null
}
```

#### 1.2 Get All Lawyer Allocations

**GET** `/legal/lawyer-allocations`

Retrieves lawyer allocations with filtering and pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `caseId` (optional): Filter by case ID
- `lawyerId` (optional): Filter by lawyer ID
- `jurisdiction` (optional): Filter by jurisdiction
- `lawyerType` (optional): Filter by lawyer type (Internal/External)
- `status` (optional): Filter by status (Active/Completed/Cancelled/Reassigned)
- `lawyerAcknowledgement` (optional): Filter by lawyer acknowledgement
- `reassignmentFlag` (optional): Filter by reassignment flag
- `allocationDateFrom` (optional): Filter from date
- `allocationDateTo` (optional): Filter to date
- `searchRemarks` (optional): Search in remarks

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid-allocation-id",
      "allocationId": "LAW-20250925-0001",
      "caseId": "uuid-case-id-here",
      "caseCode": "LC-20250925-0001",
      "loanAccountNumber": "92222222145",
      "borrowerName": "John Doe",
      "caseType": "Recovery",
      "jurisdiction": "Mumbai Sessions Court",
      "lawyerType": "Internal",
      "lawyerId": "uuid-lawyer-id-here",
      "lawyerName": "Adv. Rajesh Kumar",
      "allocationDate": "2025-09-25",
      "reassignmentFlag": false,
      "reassignmentReason": null,
      "status": "Active",
      "lawyerAcknowledgement": false,
      "remarks": "High priority case requiring experienced lawyer",
      "createdAt": "2025-09-25T10:30:00.000Z",
      "updatedAt": "2025-09-25T10:30:00.000Z",
      "createdBy": "Legal Officer",
      "updatedBy": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 1.3 Get Lawyer Allocation by ID

**GET** `/legal/lawyer-allocations/{id}`

Retrieves a specific lawyer allocation with related case and lawyer details.

**Response (200 OK):**

```json
{
  "id": "uuid-allocation-id",
  "allocationId": "LAW-20250925-0001",
  "caseId": "uuid-case-id-here",
  "caseCode": "LC-20250925-0001",
  "loanAccountNumber": "92222222145",
  "borrowerName": "John Doe",
  "caseType": "Recovery",
  "jurisdiction": "Mumbai Sessions Court",
  "lawyerType": "Internal",
  "lawyerId": "uuid-lawyer-id-here",
  "lawyerName": "Adv. Rajesh Kumar",
  "allocationDate": "2025-09-25",
  "reassignmentFlag": false,
  "reassignmentReason": null,
  "status": "Active",
  "lawyerAcknowledgement": false,
  "remarks": "High priority case requiring experienced lawyer",
  "createdAt": "2025-09-25T10:30:00.000Z",
  "updatedAt": "2025-09-25T10:30:00.000Z",
  "createdBy": "Legal Officer",
  "updatedBy": null
}
```

#### 1.4 Update Lawyer Allocation

**PUT** `/legal/lawyer-allocations/{id}`

Updates an existing lawyer allocation.

**Request Body:**

```json
{
  "jurisdiction": "Delhi High Court",
  "lawyerType": "External",
  "allocationDate": "2025-09-25",
  "reassignmentFlag": true,
  "reassignmentReason": "Lawyer unavailable due to personal reasons",
  "status": "Active",
  "lawyerAcknowledgement": true,
  "remarks": "Updated: Lawyer confirmed availability and accepted the case",
  "updatedBy": "Legal Officer - John Smith"
}
```

**Available Fields for Update:**

- `jurisdiction` - Location/Court where the case will be heard
- `lawyerType` - Internal/External lawyer type
- `allocationDate` - Date of assignment
- `reassignmentFlag` - If true, indicates reassignment
- `reassignmentReason` - Mandatory only if reassignment is true
- `status` - Active/Completed/Cancelled/Reassigned
- `lawyerAcknowledgement` - Lawyer acceptance flag
- `remarks` - Additional notes or context
- `updatedBy` - User who updated the allocation

#### 1.5 Delete Lawyer Allocation

**DELETE** `/legal/lawyer-allocations/{id}`

Deletes a lawyer allocation.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Lawyer allocation deleted successfully"
}
```

#### 1.6 Get Allocations by Case ID

**GET** `/legal/lawyer-allocations/case/{caseId}`

Retrieves all lawyer allocations for a specific case.

#### 1.7 Get Allocations by Lawyer ID

**GET** `/legal/lawyer-allocations/lawyer/{lawyerId}`

Retrieves all lawyer allocations for a specific lawyer.

### 2. Lawyer Management

#### 2.1 Create Lawyer

**POST** `/legal/lawyers`

Creates a new lawyer record.

**Request Body:**

```json
{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "email": "rajesh.kumar@lawfirm.com",
  "phone": "+91-9876543210",
  "barNumber": "BAR123456",
  "specialization": "Civil Law, Property Law",
  "experience": 8,
  "lawyerType": "Internal",
  "maxCases": 15,
  "officeLocation": "Mumbai",
  "jurisdiction": "Mumbai Sessions Court"
}
```

**Response (201 Created):**

```json
{
  "id": "uuid-lawyer-id",
  "lawyerCode": "LAW-20250925-001",
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "fullName": "Rajesh Kumar",
  "email": "rajesh.kumar@lawfirm.com",
  "phone": "+91-9876543210",
  "barNumber": "BAR123456",
  "specialization": "Civil Law, Property Law",
  "experience": 8,
  "lawyerType": "Internal",
  "maxCases": 15,
  "currentCases": 0,
  "officeLocation": "Mumbai",
  "jurisdiction": "Mumbai Sessions Court",
  "successRate": 0,
  "averageCaseDuration": 0,
  "isActive": true,
  "isAvailable": true,
  "workloadPercentage": 0,
  "workloadScore": 0,
  "createdAt": "2025-09-25T10:30:00.000Z",
  "updatedAt": "2025-09-25T10:30:00.000Z"
}
```

#### 2.2 Get All Lawyers

**GET** `/legal/lawyers`

Retrieves lawyers with filtering and pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name, email, or bar number
- `specialization` (optional): Filter by specialization
- `isAvailable` (optional): Filter by availability
- `isActive` (optional): Filter by active status
- `lawyerType` (optional): Filter by lawyer type (Internal/External)

#### 2.3 Get Available Lawyers

**GET** `/legal/lawyers/available`

Retrieves available lawyers for case assignment.

**Query Parameters:**

- `specialization` (optional): Filter by specialization
- `jurisdiction` (optional): Filter by jurisdiction
- `limit` (optional): Maximum number of lawyers to return (default: 10)

#### 2.4 Get Lawyer by ID

**GET** `/legal/lawyers/{id}`

Retrieves a specific lawyer by ID.

#### 2.5 Update Lawyer

**PUT** `/legal/lawyers/{id}`

Updates lawyer information.

**Request Body:**

```json
{
  "maxCases": 20,
  "officeLocation": "Delhi",
  "jurisdiction": "Delhi High Court",
  "isAvailable": true
}
```

#### 2.6 Get Lawyer Workload Stats

**GET** `/legal/lawyers/{id}/workload`

Retrieves workload statistics for a specific lawyer.

**Response (200 OK):**

```json
{
  "lawyerId": "uuid-lawyer-id",
  "currentCases": 5,
  "maxCases": 15,
  "workloadPercentage": 33.33,
  "isAvailable": true,
  "successRate": 85.5,
  "averageCaseDuration": 120
}
```

## Error Responses

### 400 Bad Request

```json
{
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 404 Not Found

```json
{
  "message": "Lawyer allocation with ID uuid not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### 409 Conflict

```json
{
  "message": "Case already has an active lawyer allocation",
  "error": "Conflict",
  "statusCode": 409
}
```

## Business Rules

1. **Allocation ID Generation**: Format `LAW-YYYYMMDD-Sequence` (e.g., LAW-20250925-0001)
2. **Case Status Validation**: Only cases with status 'Open' or 'Filed' can be allocated
3. **Duplicate Allocation**: A case cannot have multiple active allocations
4. **Lawyer Availability**: Only active and available lawyers can be allocated
5. **Reassignment Reason**: Mandatory when reassignment flag is true (max 500 characters)
6. **Allocation Date**: Cannot be a future date
7. **Jurisdiction**: Must be a valid court/location
8. **Lawyer Type**: Must be either 'Internal' or 'External'

## Testing with Postman

1. Import the collection: `UC008_Lawyer_Allocation_Workflow.postman_collection.json`
2. Import the environment: `UC008_Lawyer_Allocation_Environment.postman_environment.json`
3. Update environment variables with actual values:
   - `base_url`: Your API base URL
   - `auth_token`: Valid JWT token
   - `case_id`: Valid case UUID
   - `lawyer_id`: Valid lawyer UUID
   - `allocation_id`: Valid allocation UUID

## Sample Test Flow

1. **Create Lawyer** → Get `lawyer_id`
2. **Create Lawyer Allocation** → Get `allocation_id`
3. **Get Allocation by ID** → Verify creation
4. **Update Allocation** → Test updates
5. **Get Allocations by Case** → Test filtering
6. **Get Available Lawyers** → Test availability logic
7. **Delete Allocation** → Test deletion

This completes the comprehensive API documentation for UC008 Lawyer Allocation Workflow.
