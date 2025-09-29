# UC007 Legal Document Repository - Postman Collection

## Overview

This Postman collection provides comprehensive testing capabilities for the UC007 Legal Document Repository API, ensuring 100% BRD compliance and complete functionality testing.

## Collection Structure

### 1. Main Collection: `UC007_Legal_Document_Repository.postman_collection.json`

- **Document Management** - Core CRUD operations
- **Upload Document** - File upload with BRD-compliant validation
- **Get Document by ID** - Retrieve document metadata
- **Download Document** - Secure file download
- **Update Document** - Modify document properties
- **Delete Document** - Remove document and files
- **List Documents by Entity** - Paginated document listing

### 2. Version Control Collection: `UC007_Legal_Document_Repository_Version_Control.postman_collection.json`

- **Version Control** - Document versioning operations
- **Create Document Version** - Upload new version
- **Get Document Versions** - List all versions
- **Rollback to Version** - Restore previous version
- **Legal Case Specific** - Case-specific operations
- **Upload Document for Legal Case** - Direct case upload
- **Get Legal Case Documents** - Case document listing

### 3. Environment: `UC007_Legal_Document_Repository_Environment.postman_environment.json`

- Pre-configured variables for testing
- Environment-specific settings
- Test data placeholders

### 4. Test Data: `UC007_Test_Data_Samples.json`

- Sample payloads for all operations
- BRD-compliant test scenarios
- Error case examples
- Validation test data

## Setup Instructions

### 1. Import Collections

```bash
# Import main collection
Import: UC007_Legal_Document_Repository.postman_collection.json

# Import version control collection
Import: UC007_Legal_Document_Repository_Version_Control.postman_collection.json

# Import environment
Import: UC007_Legal_Document_Repository_Environment.postman_environment.json
```

### 2. Configure Environment Variables

```json
{
  "base_url": "http://localhost:3000",
  "document_id": "uuid-document-id",
  "case_id": "case-123",
  "borrower_id": "borrower-456",
  "loan_account_id": "loan-789"
}
```

### 3. Prepare Test Files

Create test files in the following formats:

- `sample-document.pdf` - PDF document
- `court-order.pdf` - Court order document
- `updated-document.pdf` - Updated version

## API Endpoints Covered

### Document Management

| Method | Endpoint                        | Description            | BRD Compliance |
| ------ | ------------------------------- | ---------------------- | -------------- |
| POST   | `/legal/documents/upload`       | Upload new document    | ✅ Full        |
| GET    | `/legal/documents/:id`          | Get document metadata  | ✅ Full        |
| GET    | `/legal/documents/:id/download` | Download document file | ✅ Full        |
| PUT    | `/legal/documents/:id`          | Update document        | ✅ Full        |
| DELETE | `/legal/documents/:id`          | Delete document        | ✅ Full        |
| GET    | `/legal/documents`              | List documents         | ✅ Full        |

### Version Control

| Method | Endpoint                                 | Description         | BRD Compliance |
| ------ | ---------------------------------------- | ------------------- | -------------- |
| POST   | `/legal/documents/:id/versions`          | Create new version  | ✅ Full        |
| GET    | `/legal/documents/:id/versions`          | Get all versions    | ✅ Full        |
| POST   | `/legal/documents/:id/rollback/:version` | Rollback to version | ✅ Full        |

### Legal Case Specific

| Method | Endpoint                                     | Description        | BRD Compliance |
| ------ | -------------------------------------------- | ------------------ | -------------- |
| POST   | `/legal/documents/legal-case/:caseId/upload` | Upload for case    | ✅ Full        |
| GET    | `/legal/documents/legal-case/:caseId`        | Get case documents | ✅ Full        |

## BRD Field Validation

### Required Fields (BRD Compliant)

- **Document ID**: Auto-generated (LDR-YYYYMMDD-Sequence)
- **Linked Entity Type**: Borrower, Loan Account, Case ID
- **Linked Entity ID**: Must exist in respective tables
- **Document Name**: Max 100 characters
- **Document Type**: Legal Notice, Court Order, Affidavit, Case Summary, Proof, Other
- **Access Permissions**: Legal Officer, Admin, Compliance, Lawyer

### Optional Fields (BRD Compliant)

- **Confidential Flag**: Boolean (default false)
- **Remarks/Tags**: Max 250 characters

### Auto-Generated Fields (BRD Compliant)

- **Upload Date**: System timestamp
- **Uploaded By**: User context
- **File Format**: MIME type detection
- **File Size (MB)**: Calculated from file
- **Version Number**: Auto-increment
- **Last Updated**: System timestamp

## Test Scenarios

### 1. Document Upload Tests

```json
{
  "testCases": [
    {
      "name": "Valid Document Upload",
      "payload": {
        "file": "sample-document.pdf",
        "linkedEntityType": "Case ID",
        "linkedEntityId": "case-123",
        "documentName": "Affidavit of Service",
        "documentType": "Affidavit",
        "accessPermissions": ["Legal Officer", "Admin"],
        "confidentialFlag": false,
        "remarksTags": "urgent, evidence, service"
      },
      "expectedStatus": 201
    },
    {
      "name": "Invalid File Type",
      "payload": {
        "file": "invalid-file.exe",
        "linkedEntityType": "Case ID",
        "linkedEntityId": "case-123",
        "documentName": "Test Document",
        "documentType": "Other",
        "accessPermissions": ["Legal Officer"]
      },
      "expectedStatus": 400
    },
    {
      "name": "File Size Exceeded",
      "payload": {
        "file": "large-file.pdf",
        "linkedEntityType": "Case ID",
        "linkedEntityId": "case-123",
        "documentName": "Large Document",
        "documentType": "Other",
        "accessPermissions": ["Legal Officer"]
      },
      "expectedStatus": 400
    }
  ]
}
```

### 2. Access Control Tests

```json
{
  "testCases": [
    {
      "name": "Authorized Access",
      "userRole": "Legal Officer",
      "documentAccessPermissions": ["Legal Officer", "Admin"],
      "expectedResult": "Access Granted"
    },
    {
      "name": "Unauthorized Access",
      "userRole": "Compliance",
      "documentAccessPermissions": ["Legal Officer", "Admin"],
      "expectedResult": "Access Denied"
    },
    {
      "name": "Confidential Document Access",
      "userRole": "Compliance",
      "confidentialFlag": true,
      "expectedResult": "Access Denied"
    }
  ]
}
```

### 3. Version Control Tests

```json
{
  "testCases": [
    {
      "name": "Create New Version",
      "action": "POST /legal/documents/:id/versions",
      "payload": {
        "file": "updated-document.pdf",
        "changeSummary": "Updated with additional witness statements"
      },
      "expectedStatus": 201
    },
    {
      "name": "Rollback to Previous Version",
      "action": "POST /legal/documents/:id/rollback/1",
      "expectedStatus": 200
    }
  ]
}
```

## Environment Variables

### Required Variables

```bash
base_url=http://localhost:3000
document_id=uuid-document-id
case_id=case-123
```

### Optional Variables

```bash
borrower_id=borrower-456
loan_account_id=loan-789
user_role=Legal Officer
user_id=legal-officer-001
```

## Pre-request Scripts

### Set Dynamic Variables

```javascript
// Set current timestamp for document ID
pm.environment.set('timestamp', new Date().toISOString().slice(0, 10).replace(/-/g, ''));

// Set random UUID for document ID
pm.environment.set('document_id', pm.variables.replaceIn('{{$randomUUID}}'));

// Set test case ID
pm.environment.set('case_id', 'case-' + Math.floor(Math.random() * 1000));
```

## Test Scripts

### Response Validation

```javascript
// Validate response status
pm.test('Status code is 201', function () {
  pm.response.to.have.status(201);
});

// Validate response structure
pm.test('Response has required fields', function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('documentId');
  pm.expect(jsonData).to.have.property('linkedEntityType');
  pm.expect(jsonData).to.have.property('linkedEntityId');
  pm.expect(jsonData).to.have.property('documentName');
  pm.expect(jsonData).to.have.property('documentType');
});

// Validate BRD compliance
pm.test('Document ID follows BRD format', function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData.documentId).to.match(/^LDR-\d{8}-\d{4}$/);
});
```

## Error Handling Tests

### Validation Errors

- Missing required fields
- Invalid file types
- File size exceeded
- Invalid entity references

### Access Control Errors

- Insufficient permissions
- Confidential document access
- Role-based restrictions

### System Errors

- Encryption failures
- File system errors
- Database errors

## Performance Testing

### Load Testing Scenarios

1. **Concurrent Uploads**: Multiple simultaneous document uploads
2. **Large File Handling**: Files approaching size limits
3. **Version Control**: Multiple version creations
4. **Search and Filter**: Large result set queries

### Response Time Expectations

- Document Upload: < 5 seconds
- Document Retrieval: < 1 second
- Document Download: < 3 seconds
- Version Operations: < 2 seconds

## Security Testing

### Encryption Validation

- Verify files are encrypted at rest
- Test decryption for authorized users
- Validate encryption key management

### Access Control Validation

- Test role-based permissions
- Verify confidential document protection
- Validate audit logging

## Monitoring and Logging

### Success Metrics

- Upload success rate: > 99%
- Response time: < 2 seconds average
- Error rate: < 1%

### Audit Trail Validation

- Document access logging
- Version creation tracking
- Permission changes
- System errors

## Troubleshooting

### Common Issues

1. **File Upload Failures**: Check file size and type
2. **Access Denied**: Verify user permissions
3. **Version Errors**: Ensure document exists
4. **Encryption Issues**: Check environment variables

### Debug Steps

1. Check environment variables
2. Verify file paths
3. Validate request payloads
4. Review server logs

## Best Practices

### Test Organization

- Group related tests in folders
- Use descriptive test names
- Include both positive and negative tests
- Maintain test data consistency

### Environment Management

- Use separate environments for different stages
- Keep sensitive data in environment variables
- Document all custom variables
- Regular environment cleanup

### Test Maintenance

- Update tests when API changes
- Review and update test data regularly
- Monitor test execution results
- Document test failures and fixes

## Conclusion

This Postman collection provides comprehensive testing coverage for the UC007 Legal Document Repository, ensuring:

✅ **100% BRD Compliance** - All required fields and validations
✅ **Complete API Coverage** - All endpoints and operations
✅ **Security Testing** - Access control and encryption validation
✅ **Error Handling** - Comprehensive error scenario testing
✅ **Performance Testing** - Load and response time validation
✅ **Version Control** - Complete versioning functionality testing

The collection is ready for immediate use and provides a solid foundation for API testing and validation.
