# UC007 - Lawyer Management APIs

## Overview

This document provides comprehensive documentation for the Lawyer Management APIs, including CRUD operations, advanced filtering, search capabilities, and workload management features.

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Request/Response Formats](#requestresponse-formats)
- [Sample Data](#sample-data)
- [Postman Collection](#postman-collection)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## API Endpoints

### Base URL

```
http://localhost:3000/api/v1/legal/lawyers
```

### 1. Lawyer CRUD Operations

#### Create Lawyer

- **POST** `/legal/lawyers`
- **Description**: Create a new lawyer record
- **Authentication**: Required (Bearer Token)

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@lawfirm.com",
  "phone": "+1234567890",
  "barNumber": "BAR123456",
  "specialization": "Civil Law",
  "experience": 5,
  "lawyerType": "Internal",
  "maxCases": 10,
  "officeLocation": "Mumbai, Maharashtra",
  "jurisdiction": "Mumbai Sessions Court, Bombay High Court"
}
```

**Response (201 Created):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "lawyerCode": "LAW-20250721-001",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "email": "john.doe@lawfirm.com",
  "phone": "+1234567890",
  "barNumber": "BAR123456",
  "specialization": "Civil Law",
  "experience": 5,
  "lawyerType": "Internal",
  "maxCases": 10,
  "currentCases": 0,
  "officeLocation": "Mumbai, Maharashtra",
  "jurisdiction": "Mumbai Sessions Court, Bombay High Court",
  "successRate": 0,
  "averageCaseDuration": 0,
  "isActive": true,
  "isAvailable": true,
  "workloadPercentage": 0,
  "workloadScore": 10,
  "createdAt": "2025-07-21T10:30:00.000Z",
  "updatedAt": "2025-07-21T10:30:00.000Z"
}
```

#### Get All Lawyers

- **GET** `/legal/lawyers`
- **Description**: Retrieve all lawyers with filtering and pagination
- **Authentication**: Required (Bearer Token)

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name, email, or bar number
- `specialization` (optional): Filter by specialization
- `isAvailable` (optional): Filter by availability (true/false)
- `isActive` (optional): Filter by active status (true/false)
- `lawyerType` (optional): Filter by lawyer type (Internal/External/Senior/Junior/Associate)

**Example Request:**

```
GET /legal/lawyers?search=John&specialization=Civil Law&isAvailable=true&page=1&limit=10
```

**Response (200 OK):**

```json
{
  "lawyers": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "lawyerCode": "LAW-20250721-001",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "email": "john.doe@lawfirm.com",
      "phone": "+1234567890",
      "barNumber": "BAR123456",
      "specialization": "Civil Law",
      "experience": 5,
      "lawyerType": "Internal",
      "maxCases": 10,
      "currentCases": 3,
      "officeLocation": "Mumbai, Maharashtra",
      "jurisdiction": "Mumbai Sessions Court, Bombay High Court",
      "successRate": 85.5,
      "averageCaseDuration": 120,
      "isActive": true,
      "isAvailable": true,
      "workloadPercentage": 30.0,
      "workloadScore": 75.5,
      "createdAt": "2025-07-21T10:30:00.000Z",
      "updatedAt": "2025-07-21T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Get Lawyer by ID

- **GET** `/legal/lawyers/{id}`
- **Description**: Retrieve a specific lawyer by ID
- **Authentication**: Required (Bearer Token)

**Response (200 OK):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "lawyerCode": "LAW-20250721-001",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "email": "john.doe@lawfirm.com",
  "phone": "+1234567890",
  "barNumber": "BAR123456",
  "specialization": "Civil Law",
  "experience": 5,
  "lawyerType": "Internal",
  "maxCases": 10,
  "currentCases": 3,
  "officeLocation": "Mumbai, Maharashtra",
  "jurisdiction": "Mumbai Sessions Court, Bombay High Court",
  "successRate": 85.5,
  "averageCaseDuration": 120,
  "isActive": true,
  "isAvailable": true,
  "workloadPercentage": 30.0,
  "workloadScore": 75.5,
  "createdAt": "2025-07-21T10:30:00.000Z",
  "updatedAt": "2025-07-21T10:30:00.000Z"
}
```

#### Get Lawyer by Email

- **GET** `/legal/lawyers/email/{email}`
- **Description**: Retrieve a specific lawyer by email address
- **Authentication**: Required (Bearer Token)

#### Update Lawyer

- **PUT** `/legal/lawyers/{id}`
- **Description**: Update an existing lawyer record
- **Authentication**: Required (Bearer Token)

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@lawfirm.com",
  "phone": "+1234567891",
  "specialization": "Criminal Law",
  "experience": 7,
  "maxCases": 15,
  "officeLocation": "Delhi, Delhi",
  "jurisdiction": "Delhi High Court, Supreme Court"
}
```

#### Delete Lawyer

- **DELETE** `/legal/lawyers/{id}`
- **Description**: Soft delete a lawyer (sets isActive to false)
- **Authentication**: Required (Bearer Token)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Lawyer deleted successfully"
}
```

### 2. Available Lawyers & Assignment

#### Get Available Lawyers

- **GET** `/legal/lawyers/available`
- **Description**: Get lawyers available for case assignment
- **Authentication**: Required (Bearer Token)

**Query Parameters:**

- `specialization` (optional): Filter by specialization
- `jurisdiction` (optional): Filter by jurisdiction
- `limit` (optional): Maximum number of lawyers to return (default: 10)

**Example Request:**

```
GET /legal/lawyers/available?specialization=Civil Law&jurisdiction=Mumbai&limit=5
```

**Response (200 OK):**

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "lawyerCode": "LAW-20250721-001",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "email": "john.doe@lawfirm.com",
    "phone": "+1234567890",
    "barNumber": "BAR123456",
    "specialization": "Civil Law",
    "experience": 5,
    "lawyerType": "Internal",
    "maxCases": 10,
    "currentCases": 3,
    "officeLocation": "Mumbai, Maharashtra",
    "jurisdiction": "Mumbai Sessions Court, Bombay High Court",
    "successRate": 85.5,
    "averageCaseDuration": 120,
    "isActive": true,
    "isAvailable": true,
    "workloadPercentage": 30.0,
    "workloadScore": 75.5,
    "createdAt": "2025-07-21T10:30:00.000Z",
    "updatedAt": "2025-07-21T10:30:00.000Z"
  }
]
```

### 3. Workload Management

#### Get Lawyer Workload Statistics

- **GET** `/legal/lawyers/{id}/workload`
- **Description**: Get workload statistics for a specific lawyer
- **Authentication**: Required (Bearer Token)

**Response (200 OK):**

```json
{
  "lawyerId": "123e4567-e89b-12d3-a456-426614174000",
  "currentCases": 3,
  "maxCases": 10,
  "workloadPercentage": 30.0,
  "isAvailable": true,
  "successRate": 85.5,
  "averageCaseDuration": 120
}
```

## Authentication

All endpoints require authentication using Bearer token:

```http
Authorization: Bearer <your-token>
```

## Request/Response Formats

### Content Type

All requests and responses use `application/json` content type.

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (e.g., duplicate email)
- `500 Internal Server Error`: Server error

## Sample Data

### Lawyer Types

- `Internal`: Internal firm lawyers
- `External`: External/contract lawyers
- `Senior`: Senior lawyers
- `Junior`: Junior lawyers
- `Associate`: Associate lawyers

### Specializations

- Civil Law
- Criminal Law
- Corporate Law
- Family Law
- Property Law
- Labor Law
- Tax Law
- Constitutional Law

### Sample Lawyer Records

#### Senior Lawyer

```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@lawfirm.com",
  "phone": "+1234567892",
  "barNumber": "BAR789012",
  "specialization": "Corporate Law",
  "experience": 12,
  "lawyerType": "Senior",
  "maxCases": 20,
  "officeLocation": "Bangalore, Karnataka",
  "jurisdiction": "Karnataka High Court, Supreme Court"
}
```

#### Junior Lawyer

```json
{
  "firstName": "Michael",
  "lastName": "Brown",
  "email": "michael.brown@lawfirm.com",
  "phone": "+1234567893",
  "barNumber": "BAR345678",
  "specialization": "Criminal Law",
  "experience": 2,
  "lawyerType": "Junior",
  "maxCases": 5,
  "officeLocation": "Chennai, Tamil Nadu",
  "jurisdiction": "Madras High Court"
}
```

#### External Lawyer

```json
{
  "firstName": "Emily",
  "lastName": "Davis",
  "email": "emily.davis@externalfirm.com",
  "phone": "+1234567894",
  "barNumber": "BAR901234",
  "specialization": "Family Law",
  "experience": 8,
  "lawyerType": "External",
  "maxCases": 12,
  "officeLocation": "Pune, Maharashtra",
  "jurisdiction": "Bombay High Court, Pune District Court"
}
```

## Postman Collection

### Import Instructions

1. Download the Postman collection: `UC007_Lawyer_Management.postman_collection.json`
2. Download the environment file: `UC007_Lawyer_Management_Environment.postman_environment.json`
3. Import both files into Postman
4. Select the "UC007 - Lawyer Management Environment" environment
5. Update the `auth_token` variable with your authentication token

### Collection Features

- **Organized Folders**: Requests grouped by functionality
- **Environment Variables**: Configurable base URL and API prefix
- **Sample Data**: Pre-configured sample requests
- **Auto-extraction**: Automatically extracts lawyer IDs from create responses
- **Response Validation**: Basic response time and content type validation
- **Error Handling**: Comprehensive error response examples

### Environment Variables

- `base_url`: API base URL (default: http://localhost:3000)
- `api_prefix`: API version prefix (default: /api/v1)
- `lawyer_id`: Sample lawyer ID for testing
- `lawyer_email`: Sample lawyer email for testing
- `auth_token`: Authentication token (set as secret)

## Error Handling

### Common Error Scenarios

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Lawyer not found",
  "error": "Not Found"
}
```

#### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Bar number already exists",
  "error": "Conflict"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Rate Limit**: 100 requests per minute per IP
- **Headers**: Rate limit information included in response headers
- **Exceeded Limit**: Returns 429 Too Many Requests

## Usage Examples

### 1. Create and Search Lawyers

```bash
# Create a lawyer
curl -X POST http://localhost:3000/api/v1/legal/lawyers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@lawfirm.com",
    "phone": "+1234567890",
    "barNumber": "BAR123456",
    "specialization": "Civil Law",
    "experience": 5,
    "lawyerType": "Internal",
    "maxCases": 10,
    "officeLocation": "Mumbai, Maharashtra",
    "jurisdiction": "Mumbai Sessions Court, Bombay High Court"
  }'

# Search for lawyers
curl -X GET "http://localhost:3000/api/v1/legal/lawyers?search=John&specialization=Civil Law" \
  -H "Authorization: Bearer your-token"
```

### 2. Get Available Lawyers for Assignment

```bash
curl -X GET "http://localhost:3000/api/v1/legal/lawyers/available?specialization=Civil Law&limit=5" \
  -H "Authorization: Bearer your-token"
```

### 3. Check Lawyer Workload

```bash
curl -X GET http://localhost:3000/api/v1/legal/lawyers/123e4567-e89b-12d3-a456-426614174000/workload \
  -H "Authorization: Bearer your-token"
```

## Support

For technical support or questions about the Lawyer Management APIs, please contact the development team or refer to the main API documentation.
