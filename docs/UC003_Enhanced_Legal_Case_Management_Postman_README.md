# Enhanced Legal Case Management - Postman Collection

## 📋 **OVERVIEW**

This Postman collection provides comprehensive testing capabilities for the Enhanced Legal Case Management system with integrated document upload functionality.

---

## 🚀 **COLLECTION FEATURES**

### **✅ Environment Variables**

- **Comprehensive variable set** with 30+ pre-configured values
- **Dynamic variable extraction** from API responses
- **Easy customization** for different environments
- **Sample data included** for immediate testing

### **✅ Sample Responses**

- **Success responses** with realistic data
- **Error responses** for validation failures
- **File upload errors** for testing edge cases
- **Authentication errors** for security testing

### **✅ Automated Testing**

- **Response validation** tests for all endpoints
- **Performance testing** (response time validation)
- **Data extraction** and variable setting
- **Error handling** validation

---

## 📁 **FILES INCLUDED**

1. **`UC003_Enhanced_Legal_Case_Management_With_Documents.postman_collection.json`**
   - Main Postman collection with all API endpoints
   - Enhanced with environment variables and sample responses

2. **`UC003_Enhanced_Legal_Case_Management_Environment.postman_environment.json`**
   - Environment file with all required variables
   - Sample data for immediate testing

3. **`UC003_Enhanced_Legal_Case_Management_Postman_README.md`**
   - This comprehensive documentation

---

## 🔧 **SETUP INSTRUCTIONS**

### **Step 1: Import Collection**

1. Open Postman
2. Click "Import" button
3. Select `UC003_Enhanced_Legal_Case_Management_With_Documents.postman_collection.json`
4. Click "Import"

### **Step 2: Import Environment**

1. Click "Import" button again
2. Select `UC003_Enhanced_Legal_Case_Management_Environment.postman_environment.json`
3. Click "Import"

### **Step 3: Select Environment**

1. Click the environment dropdown (top right)
2. Select "Enhanced Legal Case Management Environment"

### **Step 4: Configure Variables**

Update the following variables in the environment:

- `base_url`: Your API base URL (default: `http://localhost:3001/api/v1`)
- `auth_token`: Your JWT authentication token
- `lawyer_id`: Valid lawyer UUID for testing

---

## 📊 **ENVIRONMENT VARIABLES**

### **API Configuration**

| Variable      | Default Value                             | Description  |
| ------------- | ----------------------------------------- | ------------ |
| `base_url`    | `http://localhost:3001/api/v1`            | API base URL |
| `auth_token`  | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | JWT token    |
| `api_version` | `v1`                                      | API version  |

### **Case Data**

| Variable              | Default Value                          | Description         |
| --------------------- | -------------------------------------- | ------------------- |
| `loan_account_number` | `LN4567890`                            | Sample loan account |
| `case_type`           | `Civil`                                | Sample case type    |
| `court_name`          | `Mumbai Sessions Court`                | Sample court name   |
| `filing_jurisdiction` | `Mumbai, Maharashtra`                  | Sample jurisdiction |
| `case_filed_date`     | `2025-07-21`                           | Sample filed date   |
| `next_hearing_date`   | `2025-08-15`                           | Sample hearing date |
| `case_remarks`        | `Initial case filing for loan default` | Sample remarks      |

### **Document Data**

| Variable            | Default Value                            | Description              |
| ------------------- | ---------------------------------------- | ------------------------ |
| `document_name_1`   | `Affidavit of John Doe`                  | Sample document name 1   |
| `document_name_2`   | `Summons Document`                       | Sample document name 2   |
| `document_type_1`   | `Affidavit`                              | Sample document type 1   |
| `document_type_2`   | `Summons`                                | Sample document type 2   |
| `hearing_date`      | `2025-08-15`                             | Sample hearing date      |
| `document_date`     | `2025-07-21`                             | Sample document date     |
| `confidential_flag` | `false`                                  | Sample confidential flag |
| `document_remarks`  | `Initial affidavit for case proceedings` | Sample remarks           |

### **Pagination & Filtering**

| Variable               | Default Value | Description          |
| ---------------------- | ------------- | -------------------- |
| `page`                 | `1`           | Page number          |
| `limit`                | `10`          | Items per page       |
| `status_filter`        | `Filed`       | Status filter        |
| `document_type_filter` | `Evidence`    | Document type filter |

### **File Upload**

| Variable             | Default Value                | Description          |
| -------------------- | ---------------------------- | -------------------- |
| `test_file_path_1`   | `./test-files/affidavit.pdf` | Test file 1 path     |
| `test_file_path_2`   | `./test-files/summons.pdf`   | Test file 2 path     |
| `test_file_path_3`   | `./test-files/evidence.pdf`  | Test file 3 path     |
| `max_file_size`      | `10485760`                   | Max file size (10MB) |
| `allowed_file_types` | `PDF,DOCX,JPG,PNG`           | Allowed file types   |

---

## 🎯 **API ENDPOINTS COVERED**

### **Enhanced Legal Case Management**

| Method | Endpoint                                          | Description                          |
| ------ | ------------------------------------------------- | ------------------------------------ |
| `POST` | `/legal-cases-enhanced`                           | Create case with documents           |
| `PUT`  | `/legal-cases-enhanced/:id`                       | Update case with document operations |
| `GET`  | `/legal-cases-enhanced/:id/with-documents`        | Get case with all documents          |
| `GET`  | `/legal-cases-enhanced/:id/documents/statistics`  | Get document statistics              |
| `POST` | `/legal-cases-enhanced/:id/documents/bulk-upload` | Bulk upload documents                |

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

## 🧪 **TESTING FEATURES**

### **Automated Tests**

The collection includes comprehensive automated tests:

#### **Response Validation**

- ✅ Status code validation
- ✅ Response time validation (< 5000ms)
- ✅ Content-Type header validation
- ✅ Response structure validation

#### **Data Extraction**

- ✅ Automatic case ID extraction from creation responses
- ✅ Automatic document ID extraction from upload responses
- ✅ Variable setting for chained requests

#### **Error Handling**

- ✅ Validation error testing
- ✅ File upload error testing
- ✅ Authentication error testing
- ✅ Error response structure validation

#### **Endpoint-Specific Tests**

- ✅ Case creation validation
- ✅ Document upload validation
- ✅ Case with documents response validation
- ✅ Statistics response validation

### **Test Scripts**

```javascript
// Example test script included in collection
pm.test('Response status is successful', function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);
});

pm.test('Response time is less than 5000ms', function () {
  pm.expect(pm.response.responseTime).to.be.below(5000);
});
```

---

## 📝 **SAMPLE RESPONSES**

### **Success Response Example**

```json
{
  "success": true,
  "message": "Legal case created successfully with 2 documents",
  "data": {
    "case": {
      "id": "case-uuid",
      "caseId": "LC-20250721-001",
      "loanAccountNumber": "{{loan_account_number}}",
      "caseType": "{{case_type}}",
      "courtName": "{{court_name}}",
      "caseFiledDate": "{{case_filed_date}}",
      "filingJurisdiction": "{{filing_jurisdiction}}",
      "currentStatus": "Filed",
      "lawyerAssignedId": "{{lawyer_id}}",
      "nextHearingDate": "{{next_hearing_date}}",
      "caseRemarks": "{{case_remarks}}",
      "createdAt": "2025-07-21T10:30:00Z",
      "updatedAt": "2025-07-21T10:30:00Z"
    },
    "documents": [
      {
        "id": "doc-uuid-1",
        "documentName": "{{document_name_1}}",
        "originalFileName": "affidavit.pdf",
        "caseDocumentType": "{{document_type_1}}",
        "hearingDate": "{{hearing_date}}",
        "documentDate": "{{document_date}}",
        "confidentialFlag": false,
        "remarks": "{{document_remarks}}",
        "uploadDate": "2025-07-21T10:30:00Z",
        "uploadedBy": "system"
      }
    ],
    "summary": {
      "totalDocuments": 2,
      "documentsByType": {
        "{{document_type_1}}": 1,
        "{{document_type_2}}": 1
      }
    }
  }
}
```

### **Error Response Example**

```json
{
  "statusCode": 400,
  "message": [
    "loanAccountNumber should not be empty",
    "caseType should not be empty",
    "courtName should not be empty",
    "caseFiledDate should not be empty",
    "filingJurisdiction should not be empty"
  ],
  "error": "Bad Request"
}
```

---

## 🔄 **WORKFLOW TESTING**

### **Complete Workflow**

1. **Create Case with Documents** - Test enhanced case creation
2. **Get Case with Documents** - Verify case and documents
3. **Update Case with Documents** - Test document operations
4. **Bulk Upload Documents** - Test additional document uploads
5. **Get Document Statistics** - Verify statistics
6. **Delete Documents** - Test document removal

### **Independent Document Workflow**

1. **Create Case (Standard)** - Create case without documents
2. **Upload Document** - Add document independently
3. **Get Case Documents** - List all documents
4. **Delete Document** - Remove specific document

---

## 🚀 **QUICK START**

### **1. Basic Testing**

1. Import collection and environment
2. Update `base_url` and `auth_token`
3. Run "Create Legal Case with Documents" request
4. Check console for extracted case ID
5. Run other requests using the extracted case ID

### **2. File Upload Testing**

1. Prepare test files (PDF, DOCX, JPG, PNG)
2. Update file paths in environment variables
3. Run file upload requests
4. Verify files are uploaded correctly

### **3. Error Testing**

1. Run requests with invalid data
2. Test without authentication
3. Test with missing files
4. Verify error responses

---

## 📊 **PERFORMANCE TESTING**

### **Response Time Validation**

- All requests must respond within 5000ms
- Automated validation in test scripts
- Performance monitoring in console

### **Load Testing**

- Use Postman Runner for multiple iterations
- Test with different file sizes
- Monitor memory usage and response times

---

## 🔒 **SECURITY TESTING**

### **Authentication Testing**

- Test with invalid tokens
- Test without authentication
- Test with expired tokens

### **File Upload Security**

- Test with invalid file types
- Test with oversized files
- Test with malicious file names

---

## 📞 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Environment Variables Not Working**

- Ensure environment is selected
- Check variable names match exactly
- Verify variable values are set

#### **2. File Upload Failures**

- Check file paths are correct
- Ensure files exist at specified paths
- Verify file types are allowed

#### **3. Authentication Errors**

- Update `auth_token` variable
- Check token is valid and not expired
- Verify API endpoint is accessible

#### **4. Test Failures**

- Check console for detailed error messages
- Verify API is running and accessible
- Check request/response data

---

## 📚 **ADDITIONAL RESOURCES**

- **API Documentation**: See `ENHANCED_LEGAL_CASE_MANAGEMENT_README.md`
- **Implementation Guide**: See `LEGAL_CASE_DOCUMENT_IMPLEMENTATION_PLAN.md`
- **File Organization**: See `FILE_ORGANIZATION_DIAGRAM.md`
- **Multiple Documents**: See `MULTIPLE_DOCUMENTS_HANDLING.md`

---

## 🎯 **BEST PRACTICES**

### **Testing Best Practices**

1. **Start with basic requests** before complex ones
2. **Use environment variables** for all dynamic data
3. **Test error scenarios** as well as success cases
4. **Verify data extraction** from responses
5. **Clean up test data** after testing

### **File Upload Best Practices**

1. **Use realistic file sizes** for testing
2. **Test different file types** (PDF, DOCX, JPG, PNG)
3. **Verify file metadata** is stored correctly
4. **Test file organization** and naming

### **Environment Management**

1. **Use separate environments** for different stages
2. **Keep sensitive data** in environment variables
3. **Document variable purposes** clearly
4. **Regularly update** sample data

---

**Collection Version**: 1.0  
**Last Updated**: 2025-07-21  
**Compatible with**: Postman 10.0.0+
