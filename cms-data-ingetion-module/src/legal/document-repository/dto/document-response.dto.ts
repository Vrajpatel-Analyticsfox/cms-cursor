import { ApiProperty } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the document',
    example: 'uuid-document-id',
  })
  id: string;

  @ApiProperty({
    description: 'Auto-generated document ID (BRD Format: LDR-YYYYMMDD-Sequence)',
    example: 'LDR-20250721-0001',
  })
  documentId: string;

  @ApiProperty({
    description: 'Type of entity this document is linked to (BRD-specified)',
    example: 'Case ID',
    enum: ['Borrower', 'Loan Account', 'Case ID'],
  })
  linkedEntityType: 'Borrower' | 'Loan Account' | 'Case ID';

  @ApiProperty({
    description: 'ID of the entity this document is linked to',
    example: 'uuid-entity-id',
  })
  linkedEntityId: string;

  @ApiProperty({
    description: 'Name/title of the document',
    example: 'Affidavit of Service',
  })
  documentName: string;

  @ApiProperty({
    description: 'ID of the document type',
    example: 'uuid-document-type-id',
  })
  documentTypeId: string;

  @ApiProperty({
    description: 'Name of the document type',
    example: 'Legal Document',
    required: false,
  })
  documentTypeName?: string;

  @ApiProperty({
    description: 'Category of the document',
    example: 'Legal Notice',
    required: false,
  })
  documentCategory?: string;

  @ApiProperty({
    description: 'Original filename of the uploaded file',
    example: 'affidavit_service.pdf',
  })
  originalFileName: string;

  @ApiProperty({
    description: 'File format/MIME type',
    example: 'application/pdf',
  })
  fileFormat: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: '1048576',
  })
  fileSizeBytes: string;

  @ApiProperty({
    description: 'File size in MB (human readable)',
    example: '1.00',
  })
  fileSizeMb: string;

  @ApiProperty({
    description: 'Path to the stored file',
    example: '/uploads/legal-case/uuid-case-id/2025/07/21/1234567890-affidavit_service.pdf',
  })
  filePath: string;

  @ApiProperty({
    description: 'Storage provider used',
    example: 'local',
  })
  storageProvider: string;

  @ApiProperty({
    description: 'Access permissions for the document (BRD-specified)',
    example: ['Legal Officer', 'Admin'],
    type: [String],
    enum: ['Legal Officer', 'Admin', 'Compliance', 'Lawyer'],
  })
  accessPermissions: ('Legal Officer' | 'Admin' | 'Compliance' | 'Lawyer')[];

  @ApiProperty({
    description: 'Whether the document is confidential',
    example: false,
  })
  confidentialFlag: boolean;

  @ApiProperty({
    description: 'Whether the document is public',
    example: false,
  })
  isPublic: boolean;

  @ApiProperty({
    description: 'Version number of the document',
    example: 1,
  })
  versionNumber: number;

  @ApiProperty({
    description: 'ID of the parent document (for versioning)',
    example: 'uuid-parent-document-id',
    required: false,
  })
  parentDocumentId?: string;

  @ApiProperty({
    description: 'Whether this is the latest version',
    example: true,
  })
  isLatestVersion: boolean;

  @ApiProperty({
    description: 'Status of the document',
    enum: ['Active', 'Archived', 'Deleted', 'Pending_approval', 'Rejected'],
    example: 'Active',
  })
  documentStatus: 'Active' | 'Archived' | 'Deleted' | 'Pending_approval' | 'Rejected';

  @ApiProperty({
    description: 'SHA-256 hash of the document for integrity',
    example: 'a1b2c3d4e5f6...',
    required: false,
  })
  documentHash?: string;

  @ApiProperty({
    description: 'MIME type of the document',
    example: 'application/pdf',
    required: false,
  })
  mimeType?: string;

  @ApiProperty({
    description: 'Specific type of case document',
    example: 'Affidavit',
    required: false,
  })
  caseDocumentType?: string;

  @ApiProperty({
    description: 'Date of the hearing this document is related to',
    example: '2025-08-15',
    required: false,
  })
  hearingDate?: string;

  @ApiProperty({
    description: 'Date when the document was created/issued',
    example: '2025-07-21',
    required: false,
  })
  documentDate?: string;

  @ApiProperty({
    description: 'Date when the document was uploaded',
    example: '2025-07-21T10:30:00Z',
  })
  uploadDate: string;

  @ApiProperty({
    description: 'User who uploaded the document',
    example: 'legal-officer-001',
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'Date when the document was last accessed',
    example: '2025-07-21T15:45:00Z',
    required: false,
  })
  lastAccessedAt?: string;

  @ApiProperty({
    description: 'User who last accessed the document',
    example: 'lawyer-001',
    required: false,
  })
  lastAccessedBy?: string;

  @ApiProperty({
    description: 'Tags or remarks for the document',
    example: ['urgent', 'confidential', 'evidence'],
    type: [String],
  })
  remarksTags: string[];

  @ApiProperty({
    description: 'Date when the document was created',
    example: '2025-07-21T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Date when the document was last updated',
    example: '2025-07-21T15:45:00Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'User who created the document',
    example: 'legal-officer-001',
  })
  createdBy: string;

  @ApiProperty({
    description: 'User who last updated the document',
    example: 'legal-officer-001',
    required: false,
  })
  updatedBy?: string;
}

export class DocumentListResponseDto {
  @ApiProperty({
    description: 'List of documents',
    type: [DocumentResponseDto],
  })
  documents: DocumentResponseDto[];

  @ApiProperty({
    description: 'Total number of documents',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of documents per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}

export class DocumentDownloadResponseDto {
  @ApiProperty({
    description: 'Path to the file for download',
    example: '/uploads/legal-case/uuid-case-id/2025/07/21/1234567890-affidavit_service.pdf',
  })
  filePath: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'affidavit_service.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  mimeType: string;
}
