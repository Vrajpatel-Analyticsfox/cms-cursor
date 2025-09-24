# Notice Acknowledgements Module Structure

## Overview

The Notice Acknowledgements implementation has been restructured to follow the same organizational pattern as the Error Handling module, providing better separation of concerns and maintainability.

## New Folder Structure

```
src/legal/notice-acknowledgements/
├── dto/
│   ├── notice-acknowledgement.dto.ts
│   └── index.ts
├── services/
│   ├── notice-acknowledgement.service.ts
│   ├── file-upload.service.ts
│   └── index.ts
├── notice-acknowledgement.controller.ts
└── file-management.controller.ts
```

## Comparison with Error Handling Structure

### Error Handling Structure

```
src/legal/error-handling/
├── dto/
│   ├── create-error-log.dto.ts
│   ├── resolve-error.dto.ts
│   ├── error-log-response.dto.ts
│   ├── error-log-filter.dto.ts
│   └── index.ts
├── services/
│   ├── notification.service.ts
│   ├── escalation.service.ts
│   └── index.ts
├── error-handling.service.ts
└── error-handling.controller.ts
```

### Notice Acknowledgements Structure

```
src/legal/notice-acknowledgements/
├── dto/
│   ├── notice-acknowledgement.dto.ts
│   └── index.ts
├── services/
│   ├── notice-acknowledgement.service.ts
│   ├── file-upload.service.ts
│   └── index.ts
├── notice-acknowledgement.controller.ts
└── file-management.controller.ts
```

## File Organization

### DTOs (`dto/`)

- **`notice-acknowledgement.dto.ts`**: Contains all DTOs and enums for notice acknowledgements
  - `CreateNoticeAcknowledgementDto`
  - `UpdateNoticeAcknowledgementDto`
  - `NoticeAcknowledgementResponseDto`
  - `NoticeAcknowledgementFilterDto`
  - `UploadProofDto`
  - `AcknowledgedByEnum`
  - `AcknowledgementModeEnum`
  - `NoticeTypeEnum`
  - `AcknowledgementStatusEnum`
- **`index.ts`**: Exports all DTOs for easy importing

### Services (`services/`)

- **`notice-acknowledgement.service.ts`**: Core business logic for notice acknowledgements
  - CRUD operations
  - Validation logic
  - Database interactions
  - Status management
- **`file-upload.service.ts`**: File management and upload functionality
  - File upload with folder structure
  - File validation
  - File operations (download, delete)
  - Statistics and cleanup
- **`index.ts`**: Exports all services for easy importing

### Controllers

- **`notice-acknowledgement.controller.ts`**: REST API endpoints for notice acknowledgements
  - CRUD operations
  - File upload/download for acknowledgements
  - Statistics endpoints
- **`file-management.controller.ts`**: General file management endpoints
  - Generic file upload
  - Document type specific uploads
  - File operations
  - System statistics

## Import Structure

### Before Restructuring

```typescript
// Old imports
import { NoticeAcknowledgementService } from '../services/notice-acknowledgement.service';
import { FileUploadService } from '../services/file-upload.service';
import { CreateNoticeAcknowledgementDto } from '../dto/notice-acknowledgement.dto';
```

### After Restructuring

```typescript
// New imports
import { NoticeAcknowledgementService, FileUploadService } from './services';
import { CreateNoticeAcknowledgementDto } from './dto';
```

## Module Integration

### Legal Module (`src/legal/legal.module.ts`)

```typescript
// Notice Acknowledgement Services and Controllers
import {
  NoticeAcknowledgementService,
  FileUploadService,
} from './notice-acknowledgements/services';
import { NoticeAcknowledgementController } from './notice-acknowledgements/notice-acknowledgement.controller';
import { FileManagementController } from './notice-acknowledgements/file-management.controller';
```

## Benefits of Restructuring

### 1. Consistency

- **Uniform Structure**: Follows the same pattern as error-handling module
- **Predictable Organization**: Developers know where to find specific files
- **Standardized Imports**: Consistent import patterns across modules

### 2. Maintainability

- **Separation of Concerns**: Clear separation between DTOs, services, and controllers
- **Modular Design**: Each component is self-contained
- **Easy Navigation**: Logical folder structure for quick file location

### 3. Scalability

- **Extensible**: Easy to add new DTOs, services, or controllers
- **Reusable**: Services can be easily imported and used elsewhere
- **Testable**: Clear boundaries make unit testing easier

### 4. Developer Experience

- **IntelliSense**: Better IDE support with organized imports
- **Code Discovery**: Easier to find related files
- **Refactoring**: Safer refactoring with clear module boundaries

## API Endpoints

### Notice Acknowledgements (`/legal/notice-acknowledgements`)

```
POST   /legal/notice-acknowledgements                    # Create acknowledgement
GET    /legal/notice-acknowledgements                    # List acknowledgements
GET    /legal/notice-acknowledgements/:id                # Get acknowledgement by ID
PUT    /legal/notice-acknowledgements/:id                # Update acknowledgement
DELETE /legal/notice-acknowledgements/:id                # Delete acknowledgement
POST   /legal/notice-acknowledgements/:id/upload-proof   # Upload proof file
GET    /legal/notice-acknowledgements/:id/proof          # Download proof file
DELETE /legal/notice-acknowledgements/:id/proof          # Delete proof file
GET    /legal/notice-acknowledgements/statistics         # Get statistics
GET    /legal/notice-acknowledgements/file-upload/statistics # Get file statistics
```

### File Management (`/legal/files`)

```
POST   /legal/files/upload/:documentType/:entityId       # Generic upload
POST   /legal/files/upload/legal-case/:caseId            # Legal case upload
POST   /legal/files/upload/borrower/:borrowerId          # Borrower upload
POST   /legal/files/upload/lawyer/:lawyerId              # Lawyer upload
POST   /legal/files/upload/template/:templateId          # Template upload
GET    /legal/files/download/:filePath                   # Download file
DELETE /legal/files/delete/:filePath                     # Delete file
GET    /legal/files/statistics                           # Get statistics
GET    /legal/files/cleanup                              # Cleanup old files
```

## Migration Notes

### Files Moved

- `src/legal/dto/notice-acknowledgement.dto.ts` → `src/legal/notice-acknowledgements/dto/notice-acknowledgement.dto.ts`
- `src/legal/services/notice-acknowledgement.service.ts` → `src/legal/notice-acknowledgements/services/notice-acknowledgement.service.ts`
- `src/legal/services/file-upload.service.ts` → `src/legal/notice-acknowledgements/services/file-upload.service.ts`
- `src/legal/controllers/notice-acknowledgement.controller.ts` → `src/legal/notice-acknowledgements/notice-acknowledgement.controller.ts`
- `src/legal/controllers/file-management.controller.ts` → `src/legal/notice-acknowledgements/file-management.controller.ts`

### Import Paths Updated

- All relative imports updated to reflect new folder structure
- Database imports updated from `../../db/` to `../../../db/`
- DTO imports updated to use index files
- Service imports updated to use index files

### No Breaking Changes

- All API endpoints remain the same
- All functionality preserved
- Backward compatibility maintained
- Build and runtime behavior unchanged

## Future Enhancements

### Potential Additions

- **`dto/`**: Additional DTOs for specific use cases
- **`services/`**: Additional services for extended functionality
- **`interfaces/`**: Type definitions and interfaces
- **`utils/`**: Utility functions and helpers
- **`guards/`**: Authentication and authorization guards
- **`interceptors/`**: Request/response interceptors

### Consistent Pattern

This structure can be applied to other modules in the legal system:

- **`src/legal/legal-cases/`**
- **`src/legal/borrowers/`**
- **`src/legal/lawyers/`**
- **`src/legal/templates/`**

## Conclusion

The restructured Notice Acknowledgements module now follows a consistent, maintainable, and scalable pattern that aligns with the Error Handling module structure. This provides a solid foundation for future development and ensures consistency across the entire legal system.
