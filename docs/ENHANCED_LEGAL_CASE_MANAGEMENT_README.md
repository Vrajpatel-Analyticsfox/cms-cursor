# Enhanced Legal Case Management with Documents

## 📋 **OVERVIEW**

This enhanced legal case management system provides **two approaches** for handling legal cases and documents:

1. **Enhanced Approach**: Create/update cases with documents in a single operation
2. **Standard Approach**: Manage cases and documents independently (existing functionality)

Both approaches work together seamlessly, giving users maximum flexibility.

---

## 🚀 **KEY FEATURES**

### **Enhanced Case Management**

- ✅ **Create cases with documents** in a single POST request
- ✅ **Update cases with document operations** (add/remove documents)
- ✅ **Bulk document upload** to existing cases
- ✅ **Case with documents summary** - get everything in one call
- ✅ **Document statistics** for cases

### **Independent Document Management**

- ✅ **Upload documents independently** to existing cases
- ✅ **Get case documents** with filtering and pagination
- ✅ **Delete case documents** individually
- ✅ **Document versioning** and access control

### **Standard Case Management**

- ✅ **Create cases without documents** (existing functionality)
- ✅ **Update cases without documents** (existing functionality)
- ✅ **Full CRUD operations** for cases

---

## 🔧 **API ENDPOINTS**

### **Enhanced Legal Case Management**

| Method   | Endpoint                                          | Description                          |
| -------- | ------------------------------------------------- | ------------------------------------ |
| `POST`   | `/legal-cases-enhanced`                           | Create case with documents           |
| `PUT`    | `/legal-cases-enhanced/:id`                       | Update case with document operations |
| `GET`    | `/legal-cases-enhanced/:id/with-documents`        | Get case with all documents          |
| `GET`    | `/legal-cases-enhanced/:id/documents/statistics`  | Get document statistics              |
| `POST`   | `/legal-cases-enhanced/:id/documents/bulk-upload` | Bulk upload documents                |
| `DELETE` | `/legal-cases-enhanced/:id`                       | Delete case with all documents       |

### **Independent Document Management**

| Method   | Endpoint                            | Description            |
| -------- | ----------------------------------- | ---------------------- |
| `POST`   | `/legal-cases/:id/documents/upload` | Upload single document |
| `GET`    | `/legal-cases/:id/documents`        | Get case documents     |
| `DELETE` | `/legal-cases/:id/documents/:docId` | Delete document        |

### **Standard Case Management**

| Method   | Endpoint           | Description                |
| -------- | ------------------ | -------------------------- |
| `POST`   | `/legal-cases`     | Create case (no documents) |
| `GET`    | `/legal-cases`     | Get all cases              |
| `GET`    | `/legal-cases/:id` | Get case by ID             |
| `PUT`    | `/legal-cases/:id` | Update case (no documents) |
| `DELETE` | `/legal-cases/:id` | Delete case                |

---

## 📊 **USAGE SCENARIOS**

### **Scenario 1: Create Case with Initial Documents**

**Use Enhanced Approach:**

```bash
POST /legal-cases-enhanced
Content-Type: multipart/form-data

# Case data
loanAccountNumber: "LN4567890"
caseType: "Civil"
courtName: "Mumbai Sessions Court"
caseFiledDate: "2025-07-21"
filingJurisdiction: "Mumbai, Maharashtra"

# Document metadata
documents: [
  {
    "documentName": "Affidavit of John Doe",
    "caseDocumentType": "Affidavit",
    "hearingDate": "2025-08-15",
    "confidentialFlag": false
  }
]

# Files
files: [affidavit.pdf]
```

**Result**: Case created with documents uploaded in one operation.

### **Scenario 2: Add Documents to Existing Case**

**Option A - Enhanced Approach:**

```bash
PUT /legal-cases-enhanced/{caseId}
Content-Type: multipart/form-data

# Update case data
currentStatus: "Under Trial"

# Add documents
documentsToAdd: [
  {
    "documentName": "Evidence Document",
    "caseDocumentType": "Evidence"
  }
]

# Files
files: [evidence.pdf]
```

**Option B - Independent Approach:**

```bash
POST /legal-cases/{caseId}/documents/upload
Content-Type: multipart/form-data

file: evidence.pdf
documentName: "Evidence Document"
caseDocumentType: "Evidence"
```

### **Scenario 3: Bulk Document Upload**

```bash
POST /legal-cases-enhanced/{caseId}/documents/bulk-upload
Content-Type: multipart/form-data

documents: [
  {"documentName": "Witness Statement", "caseDocumentType": "Witness Statement"},
  {"documentName": "Expert Report", "caseDocumentType": "Expert Report"}
]
files: [witness_statement.pdf, expert_report.pdf]
```

### **Scenario 4: Get Complete Case Information**

```bash
GET /legal-cases-enhanced/{caseId}/with-documents
```

**Response includes:**

- Case details
- All documents
- Document summary by type
- Recent documents
- Document statistics

---

## 🎯 **BENEFITS OF DUAL APPROACH**

### **Enhanced Approach Benefits**

- ✅ **Single operation** for case + documents
- ✅ **Atomic transactions** - all or nothing
- ✅ **Better user experience** for initial case setup
- ✅ **Reduced API calls** for bulk operations
- ✅ **Comprehensive responses** with all data

### **Independent Approach Benefits**

- ✅ **Flexible document management** after case creation
- ✅ **Granular control** over individual documents
- ✅ **Existing functionality preserved** - no breaking changes
- ✅ **Better for document-heavy workflows**
- ✅ **Easier integration** with existing systems

### **Standard Approach Benefits**

- ✅ **Simple case management** without document complexity
- ✅ **Lightweight operations** for basic use cases
- ✅ **Existing API compatibility** maintained
- ✅ **Faster operations** when documents not needed

---

## 📝 **REQUEST/RESPONSE EXAMPLES**

### **Create Case with Documents**

**Request:**

```bash
POST /legal-cases-enhanced
Content-Type: multipart/form-data

loanAccountNumber: "LN4567890"
caseType: "Civil"
courtName: "Mumbai Sessions Court"
caseFiledDate: "2025-07-21"
filingJurisdiction: "Mumbai, Maharashtra"
documents: [{"documentName": "Affidavit", "caseDocumentType": "Affidavit"}]
files: [affidavit.pdf]
```

**Response:**

```json
{
  "success": true,
  "message": "Legal case created successfully with 1 documents",
  "data": {
    "case": {
      "id": "case-uuid",
      "caseId": "LC-20250721-001",
      "loanAccountNumber": "LN4567890",
      "caseType": "Civil",
      "courtName": "Mumbai Sessions Court",
      "caseFiledDate": "2025-07-21",
      "filingJurisdiction": "Mumbai, Maharashtra",
      "currentStatus": "Filed",
      "createdAt": "2025-07-21T10:30:00Z"
    },
    "documents": [
      {
        "id": "doc-uuid",
        "documentName": "Affidavit",
        "originalFileName": "affidavit.pdf",
        "caseDocumentType": "Affidavit",
        "uploadDate": "2025-07-21T10:30:00Z",
        "uploadedBy": "system"
      }
    ],
    "summary": {
      "totalDocuments": 1,
      "documentsByType": {
        "Affidavit": 1
      }
    }
  }
}
```

### **Update Case with Document Operations**

**Request:**

```bash
PUT /legal-cases-enhanced/{caseId}
Content-Type: multipart/form-data

currentStatus: "Under Trial"
documentsToAdd: [{"documentName": "Evidence", "caseDocumentType": "Evidence"}]
documentsToRemove: ["doc-uuid-to-remove"]
files: [evidence.pdf]
```

**Response:**

```json
{
  "success": true,
  "message": "Legal case updated successfully. Added: 1, Removed: 1",
  "data": {
    "case": {
      "id": "case-uuid",
      "currentStatus": "Under Trial",
      "updatedAt": "2025-07-21T11:30:00Z"
    },
    "documentsAdded": [
      {
        "id": "doc-uuid-new",
        "documentName": "Evidence",
        "caseDocumentType": "Evidence",
        "uploadDate": "2025-07-21T11:30:00Z"
      }
    ],
    "documentsRemoved": ["doc-uuid-to-remove"],
    "summary": {
      "totalDocuments": 1,
      "documentsByType": {
        "Evidence": 1
      }
    }
  }
}
```

---

## 🔄 **MIGRATION STRATEGY**

### **For Existing Users**

1. **No changes required** - existing APIs continue to work
2. **Gradual adoption** - use enhanced APIs for new features
3. **Hybrid approach** - mix both approaches as needed

### **For New Implementations**

1. **Start with enhanced APIs** for case creation
2. **Use independent APIs** for ongoing document management
3. **Choose based on use case** - enhanced for bulk operations, independent for granular control

---

## 🧪 **TESTING**

### **Test Scenarios**

1. **Create case with documents**
   - Upload multiple documents during case creation
   - Verify all documents are properly linked
   - Check document metadata is correct

2. **Update case with document operations**
   - Add new documents to existing case
   - Remove documents from case
   - Update case data and documents together

3. **Independent document management**
   - Upload documents to existing case
   - Get documents with filtering
   - Delete individual documents

4. **Bulk operations**
   - Upload multiple documents at once
   - Verify all documents are processed
   - Handle partial failures gracefully

5. **Mixed approach**
   - Create case with enhanced API
   - Add documents with independent API
   - Update case with enhanced API

---

## 📚 **POSTMAN COLLECTION**

A comprehensive Postman collection is available at:
`docs/UC003_Enhanced_Legal_Case_Management_With_Documents.postman_collection.json`

**Collection includes:**

- Enhanced case management endpoints
- Independent document management endpoints
- Standard case management endpoints
- Sample requests and responses
- Environment variables setup
- Test scripts for automation

---

## 🎯 **RECOMMENDATIONS**

### **When to Use Enhanced Approach**

- ✅ Creating new cases with initial documents
- ✅ Bulk document operations
- ✅ When you need atomic transactions
- ✅ When you want comprehensive responses

### **When to Use Independent Approach**

- ✅ Adding documents to existing cases
- ✅ Granular document management
- ✅ When you need fine-grained control
- ✅ When integrating with existing systems

### **When to Use Standard Approach**

- ✅ Simple case management without documents
- ✅ When documents are handled separately
- ✅ Lightweight operations
- ✅ Backward compatibility

### **Delete Case with All Documents**

**Request:**

```bash
DELETE /legal-cases-enhanced/{caseId}
```

**Response:**

```json
{
  "success": true,
  "message": "Legal case and 3 documents deleted successfully",
  "data": {
    "caseId": "case-uuid",
    "documentsDeleted": 3,
    "storageCleanup": {
      "localFilesDeleted": 3,
      "awsFilesDeleted": 0,
      "errors": []
    }
  }
}
```

**What happens:**

1. ✅ **Validates** case exists
2. ✅ **Retrieves** all associated documents
3. ✅ **Deletes** document records from database
4. ✅ **Removes** physical files from storage (local/AWS S3)
5. ✅ **Deletes** the legal case record
6. ✅ **Returns** cleanup summary with statistics

---

## 🔧 **CONFIGURATION**

### **Environment Variables**

```env
# Storage Configuration
STORAGE_TYPE=local  # local, aws-s3, hybrid
UPLOAD_PATH=./uploads

# AWS S3 Configuration (for future use)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=legal-documents-bucket
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### **File Upload Limits**

- **Maximum files per request**: 10
- **Maximum file size**: 10MB per file
- **Supported formats**: PDF, DOCX, JPG, PNG
- **Storage**: Local (with AWS S3 migration path)

---

## 📞 **SUPPORT**

For questions or issues:

1. Check the Postman collection for examples
2. Review the API documentation
3. Test with the provided sample data
4. Contact the development team

---

**Document Version**: 1.0  
**Last Updated**: 2025-07-21  
**Next Review**: 2025-07-28
