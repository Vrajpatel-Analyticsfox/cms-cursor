# Template ID Auto-Generation

## Overview

The template system now supports automatic generation of **numeric-only** template IDs, removing the requirement for manual template ID specification in the request body. The system generates simple incremental numeric IDs for all templates.

## Changes Made

### 1. Updated CreateTemplateDto

The `templateId` field is now **optional** in the request body:

```typescript
export class CreateTemplateDto {
  @ApiPropertyOptional({
    description: 'Unique template identifier (auto-generated if not provided)',
    example: '1',
    minLength: 1,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  templateId?: string; // Now optional!

  // ... other fields remain required
}
```

### 2. Template ID Generation Strategy

The system uses **two strategies** based on template type:

#### **Strategy 1: Numeric Incremental (Regular Templates)**

- **Format**: `1`, `2`, `3`, `4`, `5`, etc. (pure numbers only)
- **Used when**: No specific template ID provided and NOT an SMS template
- **Example**: Regular templates get `1`, `2`, `3`, etc.

#### **Strategy 2: SMS Template ID (SMS Templates)**

- **Format**: Uses the `smsTemplateId` from SMS API response
- **Used when**: Template is created for SMS channel and SMS API returns a template ID
- **Example**: SMS template with external ID `84` becomes `"84"` as the main `templateId`

## Usage Examples

### Example 1: Basic Template Creation (Auto-Generated ID)

**Request Body:**

```json
{
  "templateName": "Custom settlement offer",
  "channelId": "uuid-channel-id",
  "languageId": "uuid-language-id",
  "templateType": "Pre-Legal",
  "messageBody": "Hello {{customer_name}}, we're offering a one-time settlement of ₹{{settlement_amount}}. Valid till {{expiry_date}}.",
  "status": "Active",
  "description": "Custom settlement offer",
  "createdBy": "admin"
}
```

**Response:**

```json
{
  "id": "uuid-generated-id",
  "templateId": "1", // Auto-generated numeric ID
  "templateName": "Custom settlement offer",
  "channelId": "uuid-channel-id",
  "languageId": "uuid-language-id",
  "templateType": "Pre-Legal",
  "messageBody": "Hello {{customer_name}}, we're offering a one-time settlement of ₹{{settlement_amount}}. Valid till {{expiry_date}}.",
  "status": "Active",
  "description": "Custom settlement offer",
  "createdBy": "admin",
  "createdAt": "2025-01-16T12:00:00.000Z"
}
```

### Example 2: SMS Template Creation (Numeric ID)

**Request Body:**

```json
{
  "templateName": "SMS Legal Notice",
  "channelId": "sms-channel-uuid",
  "languageId": "uuid-language-id",
  "templateType": "Legal",
  "messageBody": "URGENT: Your EMI of Rs. {{amount}} is bounced. Pay immediately using this link {{payment_link}}.",
  "status": "Active",
  "description": "SMS legal notice template",
  "createdBy": "admin"
}
```

**Response:**

```json
{
  "id": "uuid-generated-id",
  "templateId": "84", // Uses SMS API template ID as main templateId
  "templateName": "SMS Legal Notice",
  "channelId": "sms-channel-uuid",
  "languageId": "uuid-language-id",
  "templateType": "Legal",
  "messageBody": "URGENT: Your EMI of Rs. {{amount}} is bounced. Pay immediately using this link {{payment_link}}.",
  "status": "Active",
  "description": "SMS legal notice template",
  "createdBy": "admin",
  "smsTemplateId": 84, // External SMS API ID (same as templateId)
  "dltTemplateId": "1707160889381454203", // DLT template ID
  "isApproved": false, // Pending approval
  "isActive": false, // Not active yet
  "createdAt": "2025-01-16T12:00:00.000Z"
}
```

### Example 3: Manual Template ID (Still Supported)

**Request Body:**

```json
{
  "templateId": "5", // Manually provided numeric ID
  "templateName": "Custom template",
  "channelId": "uuid-channel-id",
  "languageId": "uuid-language-id",
  "templateType": "Pre-Legal",
  "messageBody": "Hello {{customer_name}}",
  "status": "Active",
  "description": "Custom template",
  "createdBy": "admin"
}
```

**Response:**

```json
{
  "id": "uuid-generated-id",
  "templateId": "5", // Uses provided numeric ID
  "templateName": "Custom template"
  // ... other fields
}
```

## Template ID Generation Logic

### Flow Diagram

```
Template Creation Request
         ↓
    templateId provided?
         ↓                    ↓
       YES                   NO
         ↓                    ↓
   Use provided ID    Check channel type
         ↓                    ↓
   Validate unique?    SMS channel?
         ↓                    ↓
       YES                   ↓
         ↓              Generate numeric ID
   Create template      (1, 2, 3, 4, etc.)
         ↓                    ↓
   Return response      Create template
                              ↓
                        SMS API call?
                              ↓
                        YES → Use smsTemplateId as templateId
                        NO  → Keep numeric templateId
                              ↓
                        Return response
```

### Code Implementation

```typescript
// 1. Generate numeric template ID if not provided
let templateId = createTemplateDto.templateId;
if (!templateId) {
  templateId = await this.generateUniqueNumericTemplateId();
}

// 2. Create template in database with initial templateId
const templateData = {
  ...createTemplateDto,
  templateId: templateId, // e.g., "1", "2", "3"
};
const [created] = await db.insert(templateMaster).values(templateData).returning();

// 3. For SMS templates, replace templateId with smsTemplateId from API
if (smsResult && smsResult.smsTemplateId) {
  const smsTemplateId = smsResult.smsTemplateId.toString();
  await db
    .update(templateMaster)
    .set({
      templateId: smsTemplateId, // Replace with SMS template ID
      smsTemplateId: smsResult.smsTemplateId,
      dltTemplateId: smsResult.dltTemplateId,
      isApproved: smsResult.isApproved,
      isActive: smsResult.isActive,
    })
    .where(eq(templateMaster.id, created.id));
}
```

## Benefits

### 1. **Simplified API Usage**

- No need to manually generate template IDs
- Reduces API complexity for consumers
- Prevents ID collision issues

### 2. **Dual Strategy ID Generation**

- **Regular Templates**: Pure numeric IDs (1, 2, 3, 4, etc.)
- **SMS Templates**: Use SMS API template ID as main templateId
- Easy to understand and remember
- Maintains uniqueness across the system

### 3. **Backward Compatibility**

- Still supports manual template ID specification
- Existing integrations continue to work
- Gradual migration possible

### 4. **SMS Integration Benefits**

- SMS templates use the actual SMS API template ID as the main templateId
- Direct mapping between internal templateId and external SMS template ID
- No confusion about which ID to use for SMS templates
- External SMS API details stored separately (dltTemplateId, isApproved, isActive)

## Error Handling

### Duplicate ID Handling

```typescript
// If provided template ID already exists
if (existingTemplateId.length > 0) {
  throw new ConflictException('Template ID already exists');
}

// Auto-generation includes retry logic
async generateUniqueNumericTemplateId(maxRetries: number = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const templateId = await this.generateNumericTemplateId();
    const exists = await this.isTemplateIdExists(templateId);
    if (!exists) return templateId;
  }
  // Fallback to timestamp-based ID
  return Date.now().toString();
}
```

### Fallback Mechanisms

- **Database Query Failure**: Falls back to timestamp-based ID
- **SMS API Failure**: Uses regular incremental ID
- **Collision Detection**: Retries with new ID generation

## Migration Guide

### For Existing Integrations

**Before (Required templateId):**

```json
{
  "templateId": "TEMP008", // Required
  "templateName": "Template"
  // ... other fields
}
```

**After (Optional templateId):**

```json
{
  // "templateId": "1",  // Optional - can be removed (will auto-generate numeric ID)
  "templateName": "Template"
  // ... other fields
}
```

### For New Integrations

Simply omit the `templateId` field from your requests:

```json
{
  "templateName": "New Template",
  "channelId": "uuid",
  "languageId": "uuid",
  "templateType": "Pre-Legal",
  "messageBody": "Hello {{customer_name}}",
  "status": "Active",
  "createdBy": "admin"
}
```

## Testing

The system includes comprehensive tests for:

- Auto-generation logic
- ID uniqueness validation
- SMS template ID generation
- Fallback mechanisms
- Error handling scenarios

## Conclusion

The template ID auto-generation system provides a seamless experience for template creation while maintaining flexibility and backward compatibility. It uses a dual strategy approach:

- **Regular Templates**: Generate simple, clean numeric IDs (1, 2, 3, 4, etc.)
- **SMS Templates**: Use the actual SMS API template ID as the main templateId

This ensures direct mapping between internal and external systems for SMS templates while maintaining simplicity for regular templates. The implementation is consolidated directly in the template service without requiring additional files or complex logic.
