# UC003 - Notice Acknowledgement Postman Collection Setup Guide

## Quick Start

### 1. Import Collection and Environment

1. **Open Postman**
2. **Import Collection**:
   - Click "Import" button
   - Select `UC003_Notice_Acknowledgement_Complete.postman_collection.json`
   - Click "Import"

3. **Import Environment**:
   - Click "Import" button
   - Select `UC003_Notice_Acknowledgement_Environment.postman_environment.json`
   - Click "Import"

4. **Select Environment**:
   - Click on environment dropdown (top right)
   - Select "UC003 - Notice Acknowledgement Environment"

### 2. Configure Environment Variables

Update the following variables in your environment:

| Variable              | Current Value                              | Update To              |
| --------------------- | ------------------------------------------ | ---------------------- |
| `base_url`            | `http://localhost:3000`                    | Your server URL        |
| `auth_token`          | `eyJhbGciOiJIUzI1NiIs...`                  | Your JWT token         |
| `notice_id`           | `a1b2c3d4-e5f6-7890-1234-567890abcdef`     | Valid notice ID        |
| `proof_document_path` | `C:\Users\User\Documents\sample_proof.pdf` | Path to your test file |

### 3. Prepare Test Files

Create sample files for testing:

**Windows:**

```bash
# Create test directory
mkdir C:\test-files

# Create sample PDF (you can use any PDF file)
copy "C:\path\to\any\pdf\file.pdf" "C:\test-files\sample_proof.pdf"
```

**Linux/Mac:**

```bash
# Create test directory
mkdir ~/test-files

# Create sample PDF (you can use any PDF file)
cp /path/to/any/pdf/file.pdf ~/test-files/sample_proof.pdf
```

Update the `proof_document_path` variable to point to your test file.

### 4. Test the Collection

1. **Start with Basic Tests**:
   - Run "1. Create Acknowledgement (Without Document)"
   - Check response for success
   - Copy the returned `id` to `acknowledgement_id` variable

2. **Test File Upload**:
   - Run "2. Create Acknowledgement (With Document)"
   - Verify file upload works
   - Check response includes `proofOfAcknowledgement` path

3. **Test Retrieval**:
   - Run "3. Get All Acknowledgements"
   - Run "4. Get Acknowledgement by ID"

4. **Test Updates**:
   - Run "5. Update Acknowledgement"
   - Verify changes are reflected

5. **Test Statistics**:
   - Run "10. Get Acknowledgement Statistics"
   - Run "11. Get File Upload Statistics"

## Collection Structure

### 📁 Notice Acknowledgements

- **1. Create Acknowledgement (Without Document)** - JSON-based creation
- **2. Create Acknowledgement (With Document)** - Multipart with file upload
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

## Environment Variables Reference

### Required Variables

```json
{
  "base_url": "http://localhost:3000",
  "auth_token": "your_jwt_token_here",
  "notice_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "acknowledgement_id": "b1c2d3e4-f5a6-7890-1234-567890abcdef"
}
```

### File Path Variables

```json
{
  "proof_document_path": "C:\\Users\\User\\Documents\\sample_proof.pdf",
  "generic_document_path": "C:\\Users\\User\\Documents\\sample_document.pdf",
  "file_path": "acknowledgements/2025/01/21/ACKN-20250121-0001.pdf"
}
```

### Data Variables

```json
{
  "loan_account_number": "LN4567890",
  "borrower_name": "Rajiv Menon",
  "notice_type": "Pre-Legal",
  "acknowledged_by": "Family Member",
  "relationship_to_borrower": "Spouse",
  "acknowledgement_date": "2025-01-21T16:30:00Z",
  "acknowledgement_mode": "In Person",
  "remarks": "Notice acknowledged by spouse in presence of security guard",
  "captured_by": "Field Executive - Mumbai Team",
  "geo_location": "19.0760,72.8777",
  "acknowledgement_status": "Acknowledged"
}
```

## Testing Workflows

### Workflow 1: Basic Acknowledgement Flow

1. **Create** acknowledgement without document
2. **Upload** proof document
3. **Get** acknowledgement details
4. **Update** acknowledgement
5. **Get** statistics

### Workflow 2: Complete Document Flow

1. **Create** acknowledgement with document
2. **Download** proof document
3. **Update** acknowledgement
4. **Delete** proof document
5. **Delete** acknowledgement

### Workflow 3: File Management Flow

1. **Upload** generic file
2. **Download** file by path
3. **Get** file statistics
4. **Clean up** files

### Workflow 4: Statistics and Reporting

1. **Get** acknowledgement statistics
2. **Get** file upload statistics
3. **Filter** acknowledgements
4. **Generate** reports

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Error**: `401 Unauthorized`
**Solution**:

- Check `auth_token` is valid
- Verify token hasn't expired
- Ensure token format is correct

#### 2. File Upload Errors

**Error**: `400 Bad Request` or `413 Payload Too Large`
**Solution**:

- Check file path exists
- Verify file size is under 10MB
- Ensure file type is supported (PDF, JPG, PNG, DOCX)

#### 3. Validation Errors

**Error**: `400 Bad Request` with validation messages
**Solution**:

- Check all required fields are provided
- Verify field formats (dates, UUIDs, etc.)
- Ensure enum values are correct

#### 4. Network Errors

**Error**: `ECONNREFUSED` or timeout
**Solution**:

- Verify `base_url` is correct
- Check server is running
- Test connectivity with ping/curl

### Debug Tips

1. **Check Environment Variables**:
   - Go to Environment tab
   - Verify all variables are set
   - Check for typos in variable names

2. **Review Request Details**:
   - Check Headers tab
   - Verify Body content
   - Ensure Content-Type is correct

3. **Examine Response**:
   - Check Status code
   - Review Response body
   - Look for error messages

4. **Test with Minimal Data**:
   - Start with simple requests
   - Add complexity gradually
   - Test one endpoint at a time

## Advanced Usage

### Using Pre-request Scripts

The collection includes pre-request scripts that:

- Auto-generate acknowledgement IDs
- Set default values
- Validate environment variables

### Using Post-response Scripts

The collection includes post-response scripts that:

- Extract IDs from responses
- Set environment variables for chaining
- Log response data

### Chaining Requests

You can chain requests by:

1. Using post-response scripts to extract IDs
2. Setting environment variables
3. Using variables in subsequent requests

Example:

```javascript
// In post-response script
if (pm.response.code === 201) {
  const response = pm.response.json();
  pm.environment.set('acknowledgement_id', response.id);
}
```

### Custom Headers

Add custom headers in the Headers tab:

```
X-Custom-Header: custom-value
X-Request-ID: {{$randomUUID}}
```

### Dynamic Values

Use dynamic values in requests:

```
{{$randomUUID}} - Generate random UUID
{{$timestamp}} - Current timestamp
{{$randomInt}} - Random integer
{{$randomFirstName}} - Random first name
```

## API Documentation

For detailed API documentation, see:

- `UC003_Notice_Acknowledgement_API_README.md`
- `NOTICE_ACKNOWLEDGEMENT_DUAL_FLOW.md`

## Support

If you encounter issues:

1. Check this setup guide
2. Review the API documentation
3. Check server logs
4. Verify environment configuration
5. Test with minimal requests first

## Version Information

- **Collection Version**: 1.0.0
- **API Version**: 1.0.0
- **Last Updated**: 2025-01-21
- **Compatible with**: Postman 10.0+
