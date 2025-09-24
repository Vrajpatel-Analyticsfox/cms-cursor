# Notice Acknowledgement API Documentation

This folder contains all documentation and testing resources for the Notice Acknowledgement Management system (UC003).

## 📁 Contents

### Postman Collection

- **`UC003_Notice_Acknowledgement_Complete.postman_collection.json`** - Complete API collection with all 14 endpoints
- **`UC003_Notice_Acknowledgement.postman_collection.json`** - Basic API collection (simplified version)
- **`UC003_Notice_Acknowledgement_Environment.postman_environment.json`** - Environment variables for testing

### Documentation

- **`UC003_Notice_Acknowledgement_API_README.md`** - Comprehensive API documentation with examples
- **`UC003_Postman_Setup_Guide.md`** - Step-by-step setup and usage guide
- **`NOTICE_ACKNOWLEDGEMENT_DUAL_FLOW.md`** - Technical implementation details for dual flow support
- **`NOTICE_ACKNOWLEDGEMENTS_STRUCTURE.md`** - Module structure and organization documentation

### Testing Resources

- **`test-notice-acknowledgement-api.js`** - Node.js test script for programmatic testing

## 🚀 Quick Start

1. **Import Postman Collection**:
   - Import `UC003_Notice_Acknowledgement_Complete.postman_collection.json`
   - Import `UC003_Notice_Acknowledgement_Environment.postman_environment.json`

2. **Configure Environment**:
   - Update `base_url` to your server URL
   - Set valid `auth_token`
   - Update file paths for testing

3. **Start Testing**:
   - Run "1. Create Acknowledgement (Without Document)"
   - Test file upload with "2. Create Acknowledgement (With Document)"

## 📋 API Endpoints

### Notice Acknowledgements (6 endpoints)

1. Create Acknowledgement (Without Document)
2. Create Acknowledgement (With Document)
3. Get All Acknowledgements
4. Get Acknowledgement by ID
5. Update Acknowledgement
6. Delete Acknowledgement

### File Management (3 endpoints)

7. Upload Proof Document
8. Download Proof Document
9. Delete Proof Document

### Statistics & Reports (2 endpoints)

10. Get Acknowledgement Statistics
11. Get File Upload Statistics

### General File Management (3 endpoints)

12. Generic File Upload
13. Download File by Path
14. Get File Statistics

## 🔧 Features

- **Dual Flow Support**: Create acknowledgements with or without document upload
- **File Management**: Complete file upload, download, and management system
- **Statistics**: Comprehensive analytics and reporting
- **Environment Variables**: 25+ configurable variables for testing
- **Sample Responses**: Realistic response examples for all endpoints
- **Error Handling**: Complete error response documentation

## 📚 Documentation

- **API Reference**: Complete endpoint documentation with request/response examples
- **Setup Guide**: Step-by-step configuration instructions
- **Troubleshooting**: Common issues and solutions
- **Testing Workflows**: Predefined testing scenarios

## 🧪 Testing

### Postman Collection

- Import the collection and environment
- Configure variables
- Run individual tests or complete workflows

### Node.js Script

```bash
# Run all tests
node test-notice-acknowledgement-api.js

# Run specific test
node test-notice-acknowledgement-api.js create-without-doc
```

## 📖 Additional Resources

- **Dual Flow Implementation**: Technical details about the dual creation flow
- **File Upload Guidelines**: File type support, size limits, and naming conventions
- **Environment Setup**: Complete variable configuration reference
- **Troubleshooting Guide**: Common issues and debugging tips

## 🔄 Version History

- **v1.0.0**: Initial release with dual flow support
- Complete CRUD operations
- File management capabilities
- Statistics and reporting
- Comprehensive error handling

## 📞 Support

For technical support or questions:

1. Review the API documentation
2. Check the setup guide
3. Review troubleshooting section
4. Test with minimal requests first

---

**Last Updated**: 2025-01-21  
**Compatible with**: Postman 10.0+, Node.js 14+
