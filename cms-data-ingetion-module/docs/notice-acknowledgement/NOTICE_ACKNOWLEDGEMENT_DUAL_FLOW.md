# Notice Acknowledgement Dual Flow Implementation

## Overview

The Notice Acknowledgement system now supports two creation flows to provide maximum flexibility for different use cases:

1. **Create Without Document** - Traditional JSON-based creation
2. **Create With Document** - Multipart form data with optional file upload

## API Endpoints

### 1. Create Acknowledgement (Without Document)

```
POST /legal/notice-acknowledgements
Content-Type: application/json
```

**Purpose**: Creates a new acknowledgement record without uploading a document.

**Request Body**:

```json
{
  "noticeId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "acknowledgedBy": "Family Member",
  "relationshipToBorrower": "Spouse",
  "acknowledgementDate": "2025-07-20T16:30:00Z",
  "acknowledgementMode": "In Person",
  "remarks": "Notice acknowledged by spouse in presence of security guard",
  "capturedBy": "Field Executive - Mumbai Team",
  "geoLocation": "19.0760,72.8777"
}
```

**Response**:

```json
{
  "id": "b1c2d3e4-f5a6-7890-1234-567890abcdef",
  "acknowledgementId": "ACKN-20250721-0001",
  "noticeId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "loanAccountNumber": "LN4567890",
  "borrowerName": "Rajiv Menon",
  "noticeType": "Pre-Legal",
  "acknowledgedBy": "Family Member",
  "relationshipToBorrower": "Spouse",
  "acknowledgementDate": "2025-07-20T16:30:00Z",
  "acknowledgementMode": "In Person",
  "proofOfAcknowledgement": null,
  "remarks": "Notice acknowledged by spouse in presence of security guard",
  "capturedBy": "Field Executive - Mumbai Team",
  "geoLocation": "19.0760,72.8777",
  "acknowledgementStatus": "Acknowledged",
  "createdAt": "2025-07-21T10:00:00Z",
  "updatedAt": "2025-07-21T10:00:00Z",
  "createdBy": "system",
  "updatedBy": null
}
```

### 2. Create Acknowledgement (With Document)

```
POST /legal/notice-acknowledgements/with-document
Content-Type: multipart/form-data
```

**Purpose**: Creates a new acknowledgement record with an optional proof document in a single request.

**Request Body** (multipart/form-data):

```
noticeId: a1b2c3d4-e5f6-7890-1234-567890abcdef
acknowledgedBy: Family Member
relationshipToBorrower: Spouse
acknowledgementDate: 2025-07-20T16:30:00Z
acknowledgementMode: In Person
remarks: Notice acknowledged by spouse in presence of security guard
capturedBy: Field Executive - Mumbai Team
geoLocation: 19.0760,72.8777
file: [binary file data] (optional)
```

**Response** (same as above, but with `proofOfAcknowledgement` populated if file was uploaded):

```json
{
  "id": "b1c2d3e4-f5a6-7890-1234-567890abcdef",
  "acknowledgementId": "ACKN-20250721-0001",
  "noticeId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "loanAccountNumber": "LN4567890",
  "borrowerName": "Rajiv Menon",
  "noticeType": "Pre-Legal",
  "acknowledgedBy": "Family Member",
  "relationshipToBorrower": "Spouse",
  "acknowledgementDate": "2025-07-20T16:30:00Z",
  "acknowledgementMode": "In Person",
  "proofOfAcknowledgement": "/uploads/acknowledgements/2025/01/21/ACKN-20250721-0001_1641234567890_a1b2c3d4.pdf",
  "remarks": "Notice acknowledged by spouse in presence of security guard",
  "capturedBy": "Field Executive - Mumbai Team",
  "geoLocation": "19.0760,72.8777",
  "acknowledgementStatus": "Acknowledged",
  "createdAt": "2025-07-21T10:00:00Z",
  "updatedAt": "2025-07-21T10:00:00Z",
  "createdBy": "system",
  "updatedBy": null
}
```

## Implementation Details

### DTOs

#### 1. CreateNoticeAcknowledgementDto (JSON)

- Used for traditional JSON-based creation
- All fields are strings or enums
- No file handling

#### 2. CreateNoticeAcknowledgementWithDocumentDto (Multipart)

- Used for multipart form data creation
- Includes optional `file` field of type `Express.Multer.File`
- Same validation rules as JSON DTO

### Services

#### 1. createAcknowledgement()

- Handles JSON-based creation
- No file upload logic
- Returns acknowledgement without document

#### 2. createAcknowledgementWithDocument()

- Handles multipart form data creation
- Optional file upload with folder structure
- Returns acknowledgement with document path if uploaded

### Controllers

#### 1. POST /legal/notice-acknowledgements

- Accepts `application/json`
- Uses `CreateNoticeAcknowledgementDto`
- Calls `createAcknowledgement()`

#### 2. POST /legal/notice-acknowledgements/with-document

- Accepts `multipart/form-data`
- Uses `FileInterceptor('file')`
- Uses `CreateNoticeAcknowledgementWithDocumentDto`
- Calls `createAcknowledgementWithDocument()`

## File Upload Handling

### Folder Structure

When a document is uploaded, it follows the established folder structure:

```
uploads/acknowledgements/YYYY/MM/DD/{acknowledgementId}_{timestamp}_{uuid}.{ext}
```

### File Naming

- **Format**: `{acknowledgementId}_{timestamp}_{uuid}.{ext}`
- **Example**: `ACKN-20250721-0001_1641234567890_a1b2c3d4.pdf`

### Supported File Types

- PDF
- JPG
- PNG
- DOCX

## Use Cases

### When to Use "Without Document" Flow

- **Quick acknowledgements** where no proof is needed
- **API integrations** that prefer JSON
- **Mobile apps** with limited file handling
- **Bulk operations** where documents are handled separately

### When to Use "With Document" Flow

- **Field operations** where proof is immediately available
- **Web applications** with file upload capabilities
- **Single-step workflows** for efficiency
- **Document-heavy processes**

## Error Handling

### Common Errors

- **400 Bad Request**: Invalid input data or file upload error
- **404 Not Found**: Associated notice not found
- **409 Conflict**: Acknowledgement already exists for this notice

### File Upload Errors

- **File too large**: Exceeds maximum file size limit
- **Invalid file type**: Unsupported file format
- **Upload failure**: File system or network issues

## Backward Compatibility

### Existing Endpoints

- All existing endpoints remain unchanged
- No breaking changes to current functionality
- Existing clients continue to work

### Migration Path

- **Phase 1**: Use existing endpoints (no changes needed)
- **Phase 2**: Gradually adopt new endpoints as needed
- **Phase 3**: Full migration to dual flow system

## Best Practices

### Frontend Implementation

```typescript
// For JSON-based creation
const createAcknowledgement = async (data: CreateNoticeAcknowledgementDto) => {
  const response = await fetch('/legal/notice-acknowledgements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

// For multipart form data creation
const createAcknowledgementWithDocument = async (data: FormData) => {
  const response = await fetch('/legal/notice-acknowledgements/with-document', {
    method: 'POST',
    body: data,
  });
  return response.json();
};
```

### Backend Integration

```typescript
// Service layer
const acknowledgement = await this.acknowledgementService.createAcknowledgement(dto, userId);
const acknowledgementWithDoc = await this.acknowledgementService.createAcknowledgementWithDocument(
  dto,
  file,
  userId,
);
```

## Testing

### Unit Tests

- Test both creation methods
- Test with and without files
- Test validation and error handling

### Integration Tests

- Test API endpoints
- Test file upload functionality
- Test database operations

### End-to-End Tests

- Test complete workflows
- Test error scenarios
- Test performance with large files

## Monitoring and Analytics

### Metrics to Track

- **Creation method usage**: JSON vs multipart
- **File upload success rate**: Success vs failure
- **File size distribution**: Average and maximum sizes
- **Error rates**: By endpoint and error type

### Logging

- **Creation events**: Method used, success/failure
- **File upload events**: File size, type, success/failure
- **Error events**: Detailed error information

## Future Enhancements

### Potential Improvements

- **Async file processing**: Background file processing
- **File compression**: Automatic file optimization
- **CDN integration**: Content delivery network support
- **Virus scanning**: Security scanning for uploaded files
- **Metadata extraction**: Extract file metadata automatically

### API Versioning

- **v1**: Current dual flow implementation
- **v2**: Enhanced features and improvements
- **Backward compatibility**: Maintained across versions

## Conclusion

The dual flow implementation provides maximum flexibility for notice acknowledgement creation while maintaining backward compatibility and following REST principles. This approach allows different clients to choose the most appropriate method for their specific use case while ensuring consistent data handling and validation across both flows.
