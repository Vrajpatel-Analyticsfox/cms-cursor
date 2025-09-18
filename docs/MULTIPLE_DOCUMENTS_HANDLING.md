# Multiple Documents Handling - Same Type, Same Day

## 📋 **SCENARIO OVERVIEW**

This document explains how the Legal Case Management system handles multiple documents of the same type uploaded on the same day for the same case.

### **Example Scenario:**
- **Case ID**: `LC-20250721-001`
- **Date**: July 21, 2025
- **Documents**: Multiple affidavits uploaded throughout the day

---

## 🔍 **PROBLEM STATEMENT**

When multiple documents of the same type (e.g., `affidavit.pdf`) are uploaded for the same case on the same day, we need to:

1. **Avoid file name conflicts** - Prevent overwriting existing files
2. **Maintain organization** - Keep files logically organized
3. **Enable easy identification** - Make it easy to distinguish between documents
4. **Preserve audit trail** - Track upload sequence and timing

---

## ✅ **CURRENT SOLUTION**

### **1. Timestamp-Based Naming (Already Implemented)**

The current system uses `Date.now()` for unique file naming:

```typescript
// Current implementation
const timestamp = Date.now(); // Millisecond precision
const fileNameWithTimestamp = `${timestamp}_${sanitizedFileName}.${fileExtension}`;
```

**Result:**
```
uploads/legal-case/{case-id}/2025/07/21/
├── 1721544000000_affidavit.pdf  (First affidavit)
├── 1721544001000_affidavit.pdf  (Second affidavit - 1 second later)
├── 1721544002000_affidavit.pdf  (Third affidavit - 2 seconds later)
└── 1721544003000_summons.pdf    (Different document type)
```

### **2. Enhanced Naming with Sequence Numbers (New Feature)**

For better human readability and organization:

```typescript
// Enhanced naming format
// YYYYMMDD_HHMMSS_Type_Sequence_OriginalName.ext
const enhancedFileName = `${timestamp}_${caseDocumentType}_${formattedSequence}_${baseName}.${fileExtension}`;
```

**Result:**
```
uploads/legal-case/{case-id}/2025/07/21/
├── 20250721_103000_Affidavit_001_affidavit.pdf
├── 20250721_103500_Affidavit_002_affidavit.pdf
├── 20250721_104000_Affidavit_003_affidavit.pdf
└── 20250721_104500_Summons_001_summons.pdf
```

---

## 🚀 **IMPLEMENTATION DETAILS**

### **Enhanced File Naming Service**

```typescript
// New service: EnhancedFileNamingService
export class EnhancedFileNamingService {
  /**
   * Generate enhanced file name with sequence number
   */
  async generateEnhancedFileName(
    entityType: string,
    entityId: string,
    originalFileName: string,
    caseDocumentType: string,
  ): Promise<{
    fileName: string;
    filePath: string;
    sequenceNumber: number;
  }> {
    // Get next sequence number for same-day documents of same type
    const sequenceNumber = await this.getNextSequenceNumber(
      entityId,
      caseDocumentType,
      new Date(),
    );

    // Generate enhanced file name
    const enhancedFileName = this.generateFileName(
      sanitizedBaseName,
      caseDocumentType,
      sequenceNumber,
      fileExtension,
    );

    return { fileName: enhancedFileName, filePath, sequenceNumber };
  }
}
```

### **Sequence Number Logic**

```typescript
/**
 * Get next sequence number for same-day documents of same type
 */
private async getNextSequenceNumber(
  entityId: string,
  caseDocumentType: string,
  date: Date,
): Promise<number> {
  // Count existing documents of same type on same day
  const result = await this.db
    .select({ count: count() })
    .from(schema.documentRepository)
    .where(
      and(
        eq(schema.documentRepository.linkedEntityId, entityId),
        eq(schema.documentRepository.linkedEntityType, 'Legal Case'),
        eq(schema.documentRepository.caseDocumentType, caseDocumentType),
        sql`${schema.documentRepository.uploadDate} >= ${startOfDay}`,
        sql`${schema.documentRepository.uploadDate} <= ${endOfDay}`,
        eq(schema.documentRepository.documentStatus, 'active'),
      ),
    );

  const currentCount = result[0]?.count || 0;
  return currentCount + 1; // Next sequence number
}
```

---

## 📊 **REAL-WORLD EXAMPLES**

### **Example 1: Multiple Affidavits**

**Scenario**: Lawyer uploads 3 affidavits for the same case on July 21, 2025

| Upload Time | Original Name | Enhanced Name | Sequence |
|-------------|---------------|---------------|----------|
| 10:30 AM | `affidavit.pdf` | `20250721_103000_Affidavit_001_affidavit.pdf` | 1 |
| 11:15 AM | `affidavit.pdf` | `20250721_111500_Affidavit_002_affidavit.pdf` | 2 |
| 2:45 PM | `affidavit.pdf` | `20250721_144500_Affidavit_003_affidavit.pdf` | 3 |

### **Example 2: Mixed Document Types**

**Scenario**: Various document types uploaded on the same day

| Upload Time | Document Type | Enhanced Name | Sequence |
|-------------|---------------|---------------|----------|
| 10:30 AM | Affidavit | `20250721_103000_Affidavit_001_affidavit.pdf` | 1 |
| 11:15 AM | Summons | `20250721_111500_Summons_001_summons.pdf` | 1 |
| 2:45 PM | Affidavit | `20250721_144500_Affidavit_002_affidavit.pdf` | 2 |
| 3:30 PM | Evidence | `20250721_153000_Evidence_001_evidence.jpg` | 1 |

---

## 🔧 **API USAGE**

### **Upload Document with Enhanced Naming**

```typescript
// Use the enhanced upload method
const result = await hybridStorageService.uploadFileWithEnhancedNaming(
  file,
  'Legal Case',
  caseId,
  'affidavit.pdf',
  'Affidavit',
);

// Result includes sequence information
console.log(result.sequenceNumber); // 2 (if this is the second affidavit today)
console.log(result.enhancedFileName); // "20250721_103000_Affidavit_002_affidavit.pdf"
```

### **Get Same-Day Documents**

```typescript
// Get all affidavits uploaded today for a case
const sameDayDocs = await enhancedFileNamingService.getSameDayDocuments(
  caseId,
  'Affidavit',
  new Date(),
);

// Result: Array of documents with sequence numbers
[
  {
    id: 'doc-1',
    documentName: 'Affidavit of John Doe',
    originalFileName: 'affidavit.pdf',
    uploadDate: '2025-07-21T10:30:00Z',
    sequenceNumber: 1,
  },
  {
    id: 'doc-2',
    documentName: 'Affidavit of Jane Smith',
    originalFileName: 'affidavit.pdf',
    uploadDate: '2025-07-21T11:15:00Z',
    sequenceNumber: 2,
  },
]
```

---

## 🎯 **BENEFITS OF THIS APPROACH**

### **1. No File Conflicts**
- ✅ Each file gets a unique name
- ✅ No risk of overwriting existing files
- ✅ Timestamp ensures uniqueness even with rapid uploads

### **2. Human-Readable Organization**
- ✅ Easy to identify document type and sequence
- ✅ Chronological ordering by upload time
- ✅ Clear visual distinction between documents

### **3. Audit Trail**
- ✅ Track upload sequence and timing
- ✅ Maintain original file names in metadata
- ✅ Easy to trace document history

### **4. Scalable Solution**
- ✅ Works with any number of documents
- ✅ Handles rapid uploads (millisecond precision)
- ✅ Supports all document types

---

## 🔄 **MIGRATION STRATEGY**

### **Phase 1: Current System (Immediate)**
- Use existing timestamp-based naming
- No changes required to current implementation
- Handles multiple documents correctly

### **Phase 2: Enhanced Naming (Optional)**
- Implement `EnhancedFileNamingService`
- Update upload methods to use enhanced naming
- Maintain backward compatibility

### **Phase 3: Full Integration (Future)**
- Integrate with document management UI
- Show sequence numbers in document lists
- Add document comparison features

---

## 📝 **CONFIGURATION**

### **Environment Variables**

```env
# Enable enhanced file naming (optional)
ENHANCED_FILE_NAMING=true

# File naming format
FILE_NAMING_FORMAT=enhanced  # 'timestamp' or 'enhanced'

# Sequence number padding
SEQUENCE_PADDING=3  # 001, 002, 003, etc.
```

### **Service Configuration**

```typescript
// In legal.module.ts
@Module({
  providers: [
    // ... existing providers
    EnhancedFileNamingService,
  ],
})
```

---

## 🧪 **TESTING SCENARIOS**

### **Test Case 1: Rapid Uploads**
```typescript
// Upload 5 affidavits within 1 second
for (let i = 0; i < 5; i++) {
  await uploadDocument('affidavit.pdf', 'Affidavit');
}
// Expected: All files get unique names with proper sequence numbers
```

### **Test Case 2: Mixed Document Types**
```typescript
// Upload different document types on same day
await uploadDocument('affidavit.pdf', 'Affidavit');    // Sequence: 1
await uploadDocument('summons.pdf', 'Summons');        // Sequence: 1
await uploadDocument('affidavit.pdf', 'Affidavit');    // Sequence: 2
// Expected: Each type maintains its own sequence
```

### **Test Case 3: Cross-Day Uploads**
```typescript
// Upload documents on different days
await uploadDocument('affidavit.pdf', 'Affidavit');    // July 21: Sequence 1
await uploadDocument('affidavit.pdf', 'Affidavit');    // July 22: Sequence 1
// Expected: Sequence resets for new day
```

---

## 📞 **CONCLUSION**

The current system **already handles multiple documents of the same type on the same day** effectively using timestamp-based naming. The enhanced naming system provides additional benefits for human readability and organization, but is not required for basic functionality.

**Recommendation**: 
1. **Use current system** for immediate needs (already works)
2. **Implement enhanced naming** for better user experience
3. **Test thoroughly** with your specific use cases

The system is designed to handle any number of documents without conflicts, ensuring data integrity and proper organization.
