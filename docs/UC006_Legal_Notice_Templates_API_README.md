# UC006 - Legal Notice Templates Management API

## Overview

This API provides comprehensive CRUD operations for managing legal notice templates. Templates are used to generate standardized legal notices for different scenarios like pre-legal notices, legal notices, and final notices.

## Base URL

```
http://localhost:3001/api/v1/legal/legal-notice-templates
```

## Authentication

All endpoints require proper authentication. Include the appropriate headers in your requests.

## API Endpoints

### 1. Create Legal Notice Template

**POST** `/api/v1/legal/legal-notice-templates`

Creates a new legal notice template.

#### Request Body

```json
{
  "templateCode": "LNT1006",
  "templateName": "Custom Pre-Legal Notice",
  "templateType": "Pre-Legal",
  "templateContent": "Dear {{customer_name}}, your account {{account_no}} is overdue by {{days}} days. Outstanding amount: {{amount}}. Please contact us at {{phone}} to resolve this matter.",
  "languageId": "44611484-29a9-4a53-b823-4f8297a0d61d",
  "channelId": "25dd10e7-f6ec-4c7d-a1b6-3f454e0c867c",
  "maxCharacters": 600,
  "description": "Custom pre-legal notice template with additional contact information",
  "status": "active",
  "isActive": true,
  "createdBy": "admin"
}
```

#### Response

```json
{
  "id": "uuid",
  "templateCode": "LNT1006",
  "templateName": "Custom Pre-Legal Notice",
  "templateType": "Pre-Legal",
  "templateContent": "Dear {{customer_name}}, your account {{account_no}} is overdue by {{days}} days. Outstanding amount: {{amount}}. Please contact us at {{phone}} to resolve this matter.",
  "languageId": "44611484-29a9-4a53-b823-4f8297a0d61d",
  "channelId": "25dd10e7-f6ec-4c7d-a1b6-3f454e0c867c",
  "maxCharacters": 600,
  "description": "Custom pre-legal notice template with additional contact information",
  "status": "active",
  "isActive": true,
  "createdBy": "admin",
  "updatedBy": null,
  "createdAt": "2025-01-11T10:00:00.000Z",
  "updatedAt": "2025-01-11T10:00:00.000Z"
}
```

### 2. Get All Legal Notice Templates

**GET** `/api/v1/legal/legal-notice-templates`

Retrieves all legal notice templates with pagination and filtering options.

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search in template name, code, or description
- `templateType` (optional): Filter by template type (Pre-Legal, Legal, Final)
- `status` (optional): Filter by status (active, inactive)
- `isActive` (optional): Filter by active status (true, false)

#### Example Request

```
GET /api/v1/legal/legal-notice-templates?page=1&limit=10&search=Pre-Legal&templateType=Pre-Legal&status=active&isActive=true
```

#### Response

```json
{
  "templates": [
    {
      "id": "uuid",
      "templateCode": "LNT1001",
      "templateName": "Pre-Legal Notice",
      "templateType": "Pre-Legal",
      "templateContent": "Dear {{customer_name}}, your account {{account_no}} is overdue by {{days}} days. Please remit payment to avoid further action.",
      "languageId": "44611484-29a9-4a53-b823-4f8297a0d61d",
      "channelId": "25dd10e7-f6ec-4c7d-a1b6-3f454e0c867c",
      "maxCharacters": 500,
      "description": "Initial overdue notification in English via Email",
      "status": "active",
      "isActive": true,
      "createdBy": "system",
      "updatedBy": null,
      "createdAt": "2025-01-11T10:00:00.000Z",
      "updatedAt": "2025-01-11T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### 3. Get Legal Notice Template by ID

**GET** `/api/v1/legal/legal-notice-templates/{id}`

Retrieves a specific legal notice template by its ID.

#### Path Parameters

- `id`: Template UUID

#### Response

Returns the template object (same format as create response).

### 4. Get Legal Notice Template by Code

**GET** `/api/v1/legal/legal-notice-templates/code/{templateCode}`

Retrieves a specific legal notice template by its template code.

#### Path Parameters

- `templateCode`: Template code (e.g., "LNT1001")

#### Response

Returns the template object (same format as create response).

### 5. Update Legal Notice Template

**PATCH** `/api/v1/legal/legal-notice-templates/{id}`

Updates an existing legal notice template.

#### Path Parameters

- `id`: Template UUID

#### Request Body

```json
{
  "templateName": "Updated Pre-Legal Notice",
  "templateContent": "Dear {{customer_name}}, your account {{account_no}} is overdue by {{days}} days. Outstanding amount: {{amount}}. Please contact us immediately to avoid further action.",
  "maxCharacters": 700,
  "description": "Updated pre-legal notice template with enhanced messaging",
  "updatedBy": "admin"
}
```

#### Response

Returns the updated template object.

### 6. Soft Delete Legal Notice Template

**DELETE** `/api/v1/legal/legal-notice-templates/{id}`

Soft deletes a legal notice template by setting `isActive` to false.

#### Path Parameters

- `id`: Template UUID

#### Response

- Status: 204 No Content

### 7. Hard Delete Legal Notice Template

**DELETE** `/api/v1/legal/legal-notice-templates/{id}/hard`

Permanently deletes a legal notice template from the database.

#### Path Parameters

- `id`: Template UUID

#### Response

- Status: 204 No Content

## Template Variables

Templates support the following variables that can be replaced with actual values:

- `{{customer_name}}`: Customer's full name
- `{{account_no}}`: Loan account number
- `{{days}}`: Days past due
- `{{amount}}`: Outstanding amount
- `{{phone}}`: Contact phone number
- `{{email}}`: Contact email address
- `{{address}}`: Customer address

## Template Types

- **Pre-Legal**: Initial notices sent before legal action
- **Legal**: Formal legal notices
- **Final**: Final notices before legal proceedings

## Status Values

- **active**: Template is active and can be used
- **inactive**: Template is inactive and cannot be used

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Template with code 'LNT1001' already exists",
  "error": "Bad Request"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Template with ID 'uuid' not found",
  "error": "Not Found"
}
```

## Sample Data

The system comes with pre-populated sample templates:

1. **LNT1001**: Pre-Legal Notice (Email, English)
2. **LNT1002**: SMS Pre-Legal Notice (SMS, English)
3. **LNT1003**: Legal Notice (Email, English)
4. **LNT1004**: Final Notice (Email, English)
5. **LNT1005**: Hindi Pre-Legal Notice (Email, Hindi)

## Postman Collection

### Import Instructions

1. Import the collection: `UC006_Legal_Notice_Templates.postman_collection.json`
2. Import the environment: `UC006_Legal_Notice_Templates_Environment.postman_environment.json`
3. Select the environment in Postman
4. Update environment variables if needed (base_url, language_id, channel_id)

### Environment Variables

- `base_url`: API base URL (default: http://localhost:3001)
- `api_prefix`: API prefix (default: /api/v1/legal)
- `template_id`: Will be auto-populated when creating templates
- `template_code`: Template code for testing (default: LNT1001)
- `language_id`: Language ID for templates (default: English)
- `channel_id`: Channel ID for templates (default: EMAIL)
- `auth_token`: Authentication token (if required)

### Collection Features

- **Automated Tests**: Each request includes test scripts for validation
- **Environment Variables**: Dynamic values for easy testing
- **Sample Responses**: Pre-configured success and error responses
- **Test Data**: Sample templates for different scenarios
- **Error Handling**: Comprehensive error response examples

### Test Scenarios

1. **Template Management**: Full CRUD operations
2. **Search & Filter**: Advanced filtering capabilities
3. **Sample Data**: Testing with pre-populated templates
4. **Error Cases**: Validation and error handling

## Usage Examples

### Creating a Template

```bash
curl -X POST "http://localhost:3001/api/v1/legal/legal-notice-templates" \
  -H "Content-Type: application/json" \
  -d '{
    "templateCode": "LNT1006",
    "templateName": "Custom Pre-Legal Notice",
    "templateType": "Pre-Legal",
    "templateContent": "Dear {{customer_name}}, your account {{account_no}} is overdue by {{days}} days.",
    "languageId": "44611484-29a9-4a53-b823-4f8297a0d61d",
    "channelId": "25dd10e7-f6ec-4c7d-a1b6-3f454e0c867c",
    "maxCharacters": 500,
    "description": "Custom template",
    "createdBy": "admin"
  }'
```

### Searching Templates

```bash
curl "http://localhost:3001/api/v1/legal/legal-notice-templates?search=Pre-Legal&templateType=Pre-Legal&status=active"
```

### Getting Template by Code

```bash
curl "http://localhost:3001/api/v1/legal/legal-notice-templates/code/LNT1001"
```

## Database Schema

The `legal_notice_templates` table includes the following fields:

- `id`: Primary key (UUID)
- `template_code`: Unique template code
- `template_name`: Human-readable template name
- `template_type`: Type of template (Pre-Legal, Legal, Final)
- `template_content`: Template content with variables
- `language_id`: Reference to language master
- `channel_id`: Reference to channel master
- `max_characters`: Maximum character limit
- `description`: Template description
- `status`: Template status (active, inactive)
- `is_active`: Active flag
- `created_by`: Creator identifier
- `updated_by`: Last updater identifier
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
