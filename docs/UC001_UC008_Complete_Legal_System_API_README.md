# UC001-UC008 Complete Legal System API Documentation

## Overview

This comprehensive API documentation covers all 8 core services of the Legal Management System:

1. **Trigger Detection Service** - Automated detection of DPD threshold breaches and payment failures
2. **Event Validation Service** - Validation of trigger events and eligibility criteria
3. **Template Engine Service** - Dynamic template rendering with borrower and loan data
4. **Template Rendering Service** - Enhanced template rendering with compliance checks
5. **Communication Service** - Multi-channel communication (Email, SMS, WhatsApp, Courier, Post)
6. **Delivery Tracking Service** - Real-time delivery status tracking and confirmation
7. **Status Tracking Service** - Case lifecycle management and status updates
8. **Audit Trail Service** - Complete audit trail and compliance tracking

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

All endpoints require Bearer token authentication:

```bash
Authorization: Bearer <your_jwt_token>
```

## Postman Collection

### Collection Files
- **Main Collection**: `UC001_UC008_Complete_Legal_System.postman_collection.json`
- **Environment**: `UC001_UC008_Complete_Legal_System_Environment.postman_environment.json`

### Environment Variables
- `base_url`: http://localhost:3001
- `api_prefix`: api/v1
- `auth_token`: Your JWT token
- `loan_account_number`: 52222222142
- `template_id`: Template UUID
- `notice_id`: Notice UUID
- `case_id`: Case UUID
- And many more...

---

## 1. Trigger Detection Service

### Endpoints

#### Run Automated Detection
```http
POST /legal/trigger-detection/run-automated
```
Runs automated trigger detection for all accounts (scheduled daily at 9 AM).

#### Run Manual Detection
```http
POST /legal/trigger-detection/run-manual
```
Manually trigger detection for specific accounts.

**Request Body:**
```json
{
  "accountNumbers": ["52222222142", "LN4567890"],
  "triggerTypes": ["DPD_THRESHOLD", "PAYMENT_FAILURE"]
}
```

#### Detect DPD Threshold Breaches
```http
GET /legal/trigger-detection/dpd-thresholds
```
Detects accounts that have exceeded DPD thresholds (30, 60, 90, 120 days).

#### Detect Payment Failures
```http
GET /legal/trigger-detection/payment-failures
```
Detects accounts with payment failures.

#### Detect Triggers for Account
```http
GET /legal/trigger-detection/account/{accountNumber}
```
Detects all triggers for a specific account.

#### Get Trigger Statistics
```http
GET /legal/trigger-detection/statistics
```
Returns comprehensive trigger statistics.

---

## 2. Event Validation Service

### Endpoints

#### Validate Trigger Event
```http
POST /legal/event-validation/validate-trigger
```
Validates a trigger event against business rules.

**Request Body:**
```json
{
  "id": "trigger_123",
  "loanAccountId": "52222222142",
  "loanAccountNumber": "52222222142",
  "borrowerName": "John Doe",
  "triggerType": "DPD_THRESHOLD",
  "dpdDays": 65,
  "outstandingAmount": 50000,
  "detectedAt": "2025-07-21T10:30:00Z",
  "severity": "HIGH",
  "eligibilityStatus": "ELIGIBLE",
  "metadata": {
    "threshold": 60,
    "triggerReason": "DPD exceeded 60 days"
  }
}
```

#### Check Eligibility Criteria
```http
GET /legal/event-validation/eligibility/{accountNumber}
```
Checks eligibility criteria for a specific account.

#### Validate Business Rules
```http
POST /legal/event-validation/validate-business-rules
```
Validates business rules for a trigger event.

---

## 3. Template Engine Service

### Endpoints

#### Render Template
```http
POST /legal/template-engine/render
```
Renders a template with provided data.

**Request Body:**
```json
{
  "templateId": "template-uuid",
  "outputFormat": "HTML",
  "locale": "en-IN",
  "customVariables": {
    "companyLogo": "https://example.com/logo.png",
    "customMessage": "Please contact us immediately"
  },
  "templateData": {
    "borrower": {
      "name": "Mr. Rajesh Kumar Singh",
      "phone": "+91-9876543210",
      "email": "rajesh.singh@example.com",
      "address": {
        "line1": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      }
    },
    "loanAccount": {
      "accountNumber": "LN4567890",
      "outstandingAmount": 387500,
      "dpdDays": 65
    }
  }
}
```

#### Render Enhanced Template
```http
POST /legal/template-engine/render-enhanced
```
Enhanced template rendering with comprehensive data integration.

#### Render Batch Templates
```http
POST /legal/template-engine/render-batch
```
Renders multiple templates in batch.

---

## 4. Template Rendering Service

### Endpoints

#### Render Notice with Borrower Data
```http
POST /legal/template-rendering/render-notice
```
Renders notice with comprehensive borrower data integration.

**Request Body:**
```json
{
  "templateId": "template-uuid",
  "dataSource": {
    "loanAccountNumber": "52222222142",
    "userId": "user123",
    "maskSensitiveData": false,
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0",
    "sessionId": "session123"
  },
  "options": {
    "outputFormat": "HTML",
    "locale": "en-IN",
    "includeMetadata": true,
    "enableComplianceCheck": true
  },
  "customVariables": {
    "companyLogo": "https://example.com/logo.png"
  }
}
```

---

## 5. Communication Service

### Endpoints

#### Send Communication
```http
POST /legal/communication/send
```
Send communication via multiple channels.

**Request Body:**
```json
{
  "recipientId": "borrower-123",
  "recipientType": "borrower",
  "communicationMode": "EMAIL",
  "subject": "Legal Notice - Account Overdue",
  "content": "Dear Mr. John Doe, your account is overdue by 65 days. Please contact us immediately.",
  "templateId": "template-60dpd-001",
  "priority": "HIGH",
  "scheduledAt": "2025-07-22T10:00:00Z",
  "metadata": {
    "noticeId": "PLN-20250721-001",
    "caseId": "LC-20250721-001"
  }
}
```

#### Send Batch Communications
```http
POST /legal/communication/send-batch
```
Send multiple communications in batch.

#### Track Delivery by Message ID
```http
GET /legal/communication/track/{messageId}
```
Get delivery status by message ID.

#### Track Delivery by Tracking ID
```http
GET /legal/communication/track-by-tracking-id/{trackingId}
```
Get delivery status by tracking ID.

#### Update Delivery Status
```http
PUT /legal/communication/update-status
```
Update delivery status for a specific message.

#### Get Deliveries by Status
```http
GET /legal/communication/status/{status}?limit=100&offset=0
```
Get all deliveries with a specific status.

#### Get Deliveries by Recipient
```http
GET /legal/communication/recipient/{recipientId}?limit=100&offset=0
```
Get all deliveries for a specific recipient.

#### Get Communication Statistics
```http
GET /legal/communication/statistics?startDate=2025-07-01&endDate=2025-07-31
```
Get comprehensive communication statistics.

#### Get Delivery Statistics
```http
GET /legal/communication/delivery-statistics?startDate=2025-07-01&endDate=2025-07-31
```
Get detailed delivery tracking statistics.

#### Generate Delivery Report
```http
GET /legal/communication/report?startDate=2025-07-01&endDate=2025-07-31&status=DELIVERED
```
Generate comprehensive delivery report.

#### Retry Failed Deliveries
```http
POST /legal/communication/retry-failed?maxRetries=3
```
Retry all failed deliveries.

#### Retry Failed Communications
```http
POST /legal/communication/retry-failed-communications?maxRetries=3
```
Retry all failed communications.

---

## 6. Pre-Legal Notice Service

### Endpoints

#### Create Pre-Legal Notice
```http
POST /legal/pre-legal-notices
```
Create a new pre-legal notice.

**Request Body:**
```json
{
  "loanAccountNumber": "52222222142",
  "dpdDays": 65,
  "triggerType": "DPD Threshold",
  "templateId": "template-uuid",
  "communicationMode": ["Email", "SMS"],
  "stateId": "state-uuid",
  "languageId": "language-uuid",
  "noticeExpiryDate": "2025-07-28",
  "legalEntityName": "CollectPro Recovery Services",
  "issuedBy": "admin",
  "acknowledgementRequired": true,
  "noticeStatus": "Draft",
  "remarks": "Standard 60-day DPD notice"
}
```

#### Generate Notice Preview
```http
POST /legal/pre-legal-notices/preview
```
Generate a preview of the notice without saving.

#### Get Pre-Legal Notices
```http
GET /legal/pre-legal-notices?loanAccountNumber=52222222142&noticeStatus=Sent&page=1&limit=10
```
Get notices with filtering and pagination.

#### Get Notice by ID
```http
GET /legal/pre-legal-notices/{noticeId}
```
Get a specific notice by ID.

#### Update Notice Status
```http
PUT /legal/pre-legal-notices/{noticeId}/status
```
Update the status of a notice.

#### Get Notices by Account
```http
GET /legal/pre-legal-notices/account/{accountNumber}?page=1&limit=10
```
Get all notices for a specific account.

#### Get Active Templates
```http
GET /legal/pre-legal-notices/templates/active
```
Get all active notice templates.

---

## 7. Status Tracking Service

### Endpoints

#### Update Case Status
```http
PUT /legal/lawyers/cases/{caseId}/status
```
Update case status with workflow validation.

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
```http
GET /legal/lawyers/cases/{caseId}/timeline
```
Get timeline events for a specific case.

#### Get Timeline Statistics
```http
GET /legal/lawyers/timeline/statistics
```
Get comprehensive timeline statistics.

---

## 8. Audit Trail Service

### Endpoints

#### Get Audit Trail for Notice
```http
GET /legal/audit/notice/{noticeId}
```
Get complete audit trail for a specific notice.

#### Get Audit Trail for Case
```http
GET /legal/audit/case/{caseId}
```
Get complete audit trail for a specific case.

#### Get Audit Trail by User
```http
GET /legal/audit/user/{userId}?startDate=2025-07-01&endDate=2025-07-31
```
Get audit trail for a specific user within date range.

#### Get Audit Statistics
```http
GET /legal/audit/statistics?startDate=2025-07-01&endDate=2025-07-31
```
Get comprehensive audit statistics.

---

## Response Formats

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
        "field": "loanAccountNumber",
        "message": "Account number is required"
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

---

## Status Codes

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

---

## Rate Limiting

- **Standard Endpoints**: 100 requests per minute
- **Heavy Operations**: 10 requests per minute
- **Batch Operations**: 5 requests per minute

---

## Error Handling

All endpoints return consistent error responses with:
- Error code
- Human-readable message
- Detailed validation errors (if applicable)
- Timestamp
- Request ID for tracking

---

## Testing

### Using Postman

1. Import the collection: `UC001_UC008_Complete_Legal_System.postman_collection.json`
2. Import the environment: `UC001_UC008_Complete_Legal_System_Environment.postman_environment.json`
3. Set your authentication token in the environment variables
4. Run the requests in order for best results

### Test Data

The collection includes comprehensive test data for:
- Loan account numbers
- Template IDs
- Notice IDs
- Case IDs
- User IDs
- And more...

---

## Support

For technical support or questions about the API, please contact:
- **Email**: support@legal-system.com
- **Documentation**: https://docs.legal-system.com
- **Status Page**: https://status.legal-system.com

---

## Changelog

### Version 1.0.0 (2025-07-21)
- Initial release of all 8 services
- Complete Postman collection
- Comprehensive documentation
- Full API coverage

---

## License

This API documentation is proprietary and confidential. Unauthorized distribution is prohibited.
