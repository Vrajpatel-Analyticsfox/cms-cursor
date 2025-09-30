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
  })
  linkedEntityType: string;

  @ApiProperty({
    description: 'ID of the entity this document is linked to',
    example: 'entity-id-123',
  })
  linkedEntityId: string;

  @ApiProperty({
    description: 'Additional details about the linked entity',
    example: { caseId: 'LC-20250721-0001', borrowerName: 'John Doe' },
    required: false,
  })
  linkedEntityDetails?: {
    caseId?: string;
    borrowerName?: string;
    loanAccountNumber?: string;
    currentStatus?: string;
    caseType?: string;
    courtName?: string;
    [key: string]: any;
  };

  @ApiProperty({
    description: 'Name/title of the document (BRD: Max 100 characters)',
    example: 'Affidavit of Service',
  })
  documentName: string;

  @ApiProperty({
    description: 'Classification of document (BRD-specified)',
    example: 'Legal Notice',
  })
  documentType: string;

  @ApiProperty({
    description: 'Date when the document was uploaded (BRD-specified)',
    example: '2025-07-21T10:30:00Z',
  })
  uploadDate: string;

  @ApiProperty({
    description: 'User who uploaded the document (BRD-specified)',
    example: 'legal-officer-001',
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'File format/MIME type (BRD-specified)',
    example: 'application/pdf',
  })
  fileFormat: string;

  @ApiProperty({
    description: 'File size in MB (BRD-specified)',
    example: '1.00',
  })
  fileSizeMb: string;

  @ApiProperty({
    description: 'Access permissions for the document (BRD-specified)',
    example: ['Legal Officer', 'Admin'],
    type: [String],
  })
  accessPermissions: string[];

  @ApiProperty({
    description: 'Whether the document is confidential (BRD-specified)',
    example: false,
  })
  confidentialFlag: boolean;

  @ApiProperty({
    description: 'Version number of the document (BRD-specified)',
    example: 1,
  })
  versionNumber: number;

  @ApiProperty({
    description: 'Tags or remarks for the document (BRD-specified)',
    example: 'urgent, confidential, evidence',
  })
  remarksTags?: string;

  @ApiProperty({
    description: 'Date when the document was last updated (BRD-specified)',
    example: '2025-07-21T15:45:00Z',
  })
  lastUpdated: string;

  // Additional fields for basic functionality (not in BRD but required for system operation)
  @ApiProperty({
    description: 'Original filename of the uploaded file',
    example: 'affidavit_service.pdf',
  })
  originalFileName: string;

  @ApiProperty({
    description: 'Path to the stored file',
    example: '/uploads/legal-case/entity-id-123/2025/07/21/1234567890-affidavit_service.pdf',
  })
  filePath: string;

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
