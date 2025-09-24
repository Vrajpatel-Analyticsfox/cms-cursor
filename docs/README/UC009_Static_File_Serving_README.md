# UC009 - Static File Serving API

## Overview

This API provides endpoints to serve static files (uploaded documents) via HTTP. It allows clients to download/view documents that were previously uploaded through the legal case management system.

## 🚀 **Available Endpoints**

### 1. Serve Document by Case ID and Filename

```
GET /api/v1/legal/static/document/{caseId}/{filename}
```

**Description**: Serves a document file by case ID and filename. This endpoint assumes a fixed directory structure.

**Parameters**:

- `caseId` (string): Legal case ID
- `filename` (string): Document filename

**Example**:

```
GET /api/v1/legal/static/document/7d6e4d5f-4827-4568-93ab-2b828142f01c/1757705394431-LegalModule_BRD 1.pdf
```

### 2. Serve Document by Full Path

```
GET /api/v1/legal/static/document-by-path/{caseId}/{year}/{month}/{day}/{filename}
```

**Description**: Serves a document file by providing the full path components. This is more flexible for dynamic file paths.

**Parameters**:

- `caseId` (string): Legal case ID
- `year` (string): Year (e.g., "2025")
- `month` (string): Month (e.g., "09")
- `day` (string): Day (e.g., "13")
- `filename` (string): Document filename

**Example**:

```
GET /api/v1/legal/static/document-by-path/7d6e4d5f-4827-4568-93ab-2b828142f01c/2025/09/13/1757705394431-LegalModule_BRD 1.pdf
```

## 📁 **File Path Structure**

Documents are stored in the following structure:

```
uploads/
└── legal-case/
    └── {caseId}/
        └── {year}/
            └── {month}/
                └── {day}/
                    └── {filename}
```

## 🔐 **Authentication**

All endpoints require Bearer token authentication:

```
Authorization: Bearer your-token-here
```

## 📋 **Response Headers**

When a file is successfully served, the following headers are set:

- `Content-Type`: MIME type based on file extension
- `Content-Length`: File size in bytes
- `Content-Disposition`: `inline; filename="original-filename"`
- `Cache-Control`: `public, max-age=3600` (1 hour cache)

## 🎯 **Supported File Types**

The API automatically detects MIME types for the following file extensions:

| Extension   | MIME Type                                                               |
| ----------- | ----------------------------------------------------------------------- |
| .pdf        | application/pdf                                                         |
| .doc        | application/msword                                                      |
| .docx       | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| .jpg, .jpeg | image/jpeg                                                              |
| .png        | image/png                                                               |
| .gif        | image/gif                                                               |
| .txt        | text/plain                                                              |
| .csv        | text/csv                                                                |
| .xlsx       | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet       |
| .xls        | application/vnd.ms-excel                                                |

## 📝 **Response Examples**

### Success Response (200)

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 1493705
Content-Disposition: inline; filename="1757705394431-LegalModule_BRD 1.pdf"
Cache-Control: public, max-age=3600

[Binary file content streamed directly]
```

### Error Response (404)

```json
{
  "statusCode": 404,
  "message": "File not found",
  "error": "Not Found"
}
```

## 🧪 **Testing with cURL**

### Test Document by Case ID and Filename

```bash
curl -X GET "http://localhost:3001/api/v1/legal/static/document/7d6e4d5f-4827-4568-93ab-2b828142f01c/1757705394431-LegalModule_BRD%201.pdf" \
  -H "Authorization: Bearer test-token" \
  --output downloaded-file.pdf
```

### Test Document by Full Path

```bash
curl -X GET "http://localhost:3001/api/v1/legal/static/document-by-path/7d6e4d5f-4827-4568-93ab-2b828142f01c/2025/09/13/1757705394431-LegalModule_BRD%201.pdf" \
  -H "Authorization: Bearer test-token" \
  --output downloaded-file.pdf
```

## 🔧 **Browser Usage**

You can also access these URLs directly in a browser (with proper authentication):

```
http://localhost:3001/api/v1/legal/static/document/7d6e4d5f-4827-4568-93ab-2b828142f01c/1757705394431-LegalModule_BRD%201.pdf
```

The browser will display the file inline (for PDFs, images) or prompt for download.

## 🚨 **Error Handling**

- **404 Not Found**: File doesn't exist at the specified path
- **401 Unauthorized**: Missing or invalid authentication token
- **500 Internal Server Error**: Server error while reading the file

## 🔒 **Security Considerations**

1. **Authentication Required**: All endpoints require valid Bearer token
2. **Path Validation**: File paths are constructed server-side to prevent directory traversal attacks
3. **File Type Validation**: Only files with recognized extensions are served
4. **Case ID Validation**: Files are scoped to specific case IDs

## 📊 **Performance Features**

- **Streaming**: Files are streamed directly to the client (no memory buffering)
- **Caching**: Files are cached for 1 hour via HTTP headers
- **Efficient**: Uses Node.js streams for optimal memory usage

## 🛠️ **Integration with Legal Case Management**

This static file serving API works seamlessly with the legal case management system:

1. **Upload**: Use the enhanced legal case creation API to upload documents
2. **Store**: Documents are stored with the organized file structure
3. **Retrieve**: Use this static file serving API to download/view documents
4. **Metadata**: Use the legal case document APIs to get file metadata and paths

## 📋 **Postman Collection**

Use the provided Postman collection `UC009_Static_File_Serving.postman_collection.json` to test all endpoints with pre-configured examples and test scripts.

## 🚀 **Quick Start**

1. **Start the application**:

   ```bash
   npm run start:dev
   ```

2. **Test file serving**:

   ```bash
   curl -X GET "http://localhost:3001/api/v1/legal/static/document/your-case-id/your-filename.pdf" \
     -H "Authorization: Bearer test-token"
   ```

3. **View in browser**:
   Open the URL in your browser with proper authentication headers.

## 🔄 **Future Enhancements**

- **AWS S3 Integration**: Serve files directly from S3 with signed URLs
- **CDN Support**: Integrate with CDN for better performance
- **File Compression**: Automatic compression for large files
- **Thumbnail Generation**: Generate thumbnails for images and PDFs
- **Access Logging**: Track file access for audit purposes

