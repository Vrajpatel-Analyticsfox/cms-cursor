# File Organization Diagram - Multiple Documents Handling

## 📁 **Directory Structure Example**

```
uploads/
└── legal-case/
    └── LC-20250721-001/                    # Case ID
        └── 2025/
            └── 07/
                └── 21/                     # July 21, 2025
                    ├── 20250721_103000_Affidavit_001_affidavit.pdf
                    ├── 20250721_111500_Affidavit_002_affidavit.pdf
                    ├── 20250721_144500_Affidavit_003_affidavit.pdf
                    ├── 20250721_153000_Summons_001_summons.pdf
                    ├── 20250721_160000_Evidence_001_evidence.jpg
                    └── 20250721_170000_Evidence_002_evidence.jpg
```

## 🔢 **Sequence Number Logic**

### **Same Document Type, Same Day**

```
Affidavit Documents (July 21, 2025):
├── 001 - First affidavit of the day
├── 002 - Second affidavit of the day
├── 003 - Third affidavit of the day
└── 004 - Fourth affidavit of the day
```

### **Different Document Types, Same Day**

```
July 21, 2025 Documents:
├── Affidavit_001, Affidavit_002, Affidavit_003
├── Summons_001
├── Evidence_001, Evidence_002
└── Court_Order_001
```

### **Same Document Type, Different Days**

```
Affidavit Documents:
├── July 21: Affidavit_001, Affidavit_002
├── July 22: Affidavit_001, Affidavit_002  # Sequence resets
└── July 23: Affidavit_001
```

## 📊 **File Naming Convention**

### **Enhanced Naming Format**

```
YYYYMMDD_HHMMSS_Type_Sequence_OriginalName.ext
```

### **Examples**

```
20250721_103000_Affidavit_001_affidavit.pdf
│        │       │         │    │
│        │       │         │    └─ Original file name
│        │       │         └────── Sequence number (001, 002, 003...)
│        │       └──────────────── Document type
│        └──────────────────────── Upload time (HHMMSS)
└────────────────────────────────── Upload date (YYYYMMDD)
```

## 🔄 **Upload Flow Example**

### **Scenario: Multiple Affidavits Upload**

```
1. First Affidavit Upload (10:30 AM)
   ├── Check existing affidavits today: 0
   ├── Generate sequence: 001
   ├── Create filename: 20250721_103000_Affidavit_001_affidavit.pdf
   └── Store: uploads/legal-case/LC-20250721-001/2025/07/21/

2. Second Affidavit Upload (11:15 AM)
   ├── Check existing affidavits today: 1
   ├── Generate sequence: 002
   ├── Create filename: 20250721_111500_Affidavit_002_affidavit.pdf
   └── Store: uploads/legal-case/LC-20250721-001/2025/07/21/

3. Third Affidavit Upload (2:45 PM)
   ├── Check existing affidavits today: 2
   ├── Generate sequence: 003
   ├── Create filename: 20250721_144500_Affidavit_003_affidavit.pdf
   └── Store: uploads/legal-case/LC-20250721-001/2025/07/21/
```

## 🎯 **Database Records**

### **Document Repository Table**

```sql
-- Example records for multiple affidavits
INSERT INTO document_repository VALUES
('doc-1', 'DOC-20250721-001', 'Legal Case', 'LC-20250721-001', 'Affidavit of John Doe',
 '20250721_103000_Affidavit_001_affidavit.pdf', 'PDF', '2025-07-21 10:30:00', 'Affidavit'),

('doc-2', 'DOC-20250721-002', 'Legal Case', 'LC-20250721-001', 'Affidavit of Jane Smith',
 '20250721_111500_Affidavit_002_affidavit.pdf', 'PDF', '2025-07-21 11:15:00', 'Affidavit'),

('doc-3', 'DOC-20250721-003', 'Legal Case', 'LC-20250721-001', 'Affidavit of Bob Johnson',
 '20250721_144500_Affidavit_003_affidavit.pdf', 'PDF', '2025-07-21 14:45:00', 'Affidavit');
```

## 🔍 **Query Examples**

### **Get All Affidavits for a Case Today**

```sql
SELECT
  document_name,
  original_file_name,
  upload_date,
  file_path
FROM document_repository
WHERE linked_entity_id = 'LC-20250721-001'
  AND case_document_type = 'Affidavit'
  AND DATE(upload_date) = '2025-07-21'
ORDER BY upload_date;
```

### **Get Document Count by Type Today**

```sql
SELECT
  case_document_type,
  COUNT(*) as document_count
FROM document_repository
WHERE linked_entity_id = 'LC-20250721-001'
  AND DATE(upload_date) = '2025-07-21'
GROUP BY case_document_type;
```

## 📱 **API Response Example**

### **Get Case Documents**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "doc-1",
        "documentName": "Affidavit of John Doe",
        "originalFileName": "affidavit.pdf",
        "enhancedFileName": "20250721_103000_Affidavit_001_affidavit.pdf",
        "caseDocumentType": "Affidavit",
        "sequenceNumber": 1,
        "uploadDate": "2025-07-21T10:30:00Z",
        "filePath": "uploads/legal-case/LC-20250721-001/2025/07/21/20250721_103000_Affidavit_001_affidavit.pdf"
      },
      {
        "id": "doc-2",
        "documentName": "Affidavit of Jane Smith",
        "originalFileName": "affidavit.pdf",
        "enhancedFileName": "20250721_111500_Affidavit_002_affidavit.pdf",
        "caseDocumentType": "Affidavit",
        "sequenceNumber": 2,
        "uploadDate": "2025-07-21T11:15:00Z",
        "filePath": "uploads/legal-case/LC-20250721-001/2025/07/21/20250721_111500_Affidavit_002_affidavit.pdf"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2
    }
  }
}
```

## 🛡️ **Conflict Prevention**

### **Timestamp Precision**

- Uses `Date.now()` for millisecond precision
- Even rapid uploads get unique timestamps
- No risk of file name conflicts

### **Sequence Number Safety**

- Database-level sequence counting
- Atomic operations prevent race conditions
- Handles concurrent uploads correctly

### **File System Safety**

- Organized directory structure
- Unique file paths for each document
- No overwrite risk

## 📈 **Scalability Considerations**

### **Performance**

- Efficient database queries for sequence counting
- Indexed columns for fast lookups
- Minimal overhead for file naming

### **Storage**

- Organized by date and case
- Easy to archive old documents
- Efficient disk usage

### **Maintenance**

- Clear file naming convention
- Easy to identify and manage documents
- Simple cleanup procedures
