# SMS Template Format Conversion

## Overview

This document explains the template format conversion system implemented for SMS template integration. The system automatically converts between two different template variable formats:

- **Internal Format**: `{{variable_name}}` (used within our system)
- **SMS API Format**: `{#var#}` (used by external SMS portal service)

## Problem Statement

Our internal system uses template variables in the format `{{variable_name}}`, but the external SMS portal service requires variables in the format `{#var#}`. This conversion needs to happen automatically during:

1. **Template Creation**: Convert internal format to SMS format before sending to external API
2. **Template Updates**: Convert internal format to SMS format before updating external API
3. **Template Retrieval**: Convert SMS format back to internal format when fetching from external API

## Solution Architecture

### TemplateFormatService

A dedicated service that handles all template format conversions with the following methods:

#### Core Conversion Methods

```typescript
// Convert {{var}} to {#var#}
convertToSmsFormat(template: string): string

// Convert {#var#} to {{var}}
convertFromSmsFormat(template: string): string

// Convert {{var}} to {#var#} (preserving variable names)
convertToGenericSmsFormat(template: string): string

// Convert {#var#} to {{var}} (preserving variable names)
convertFromGenericSmsFormat(template: string): string
```

#### Detection Methods

```typescript
// Check if template uses internal format {{var}}
isInternalFormat(template: string): boolean

// Check if template uses SMS API format {#var#}
isSmsApiFormat(template: string): boolean
```

#### Auto-Conversion Methods

```typescript
// Auto-detect and convert to SMS format
autoConvertToSmsFormat(template: string): string

// Auto-detect and convert to internal format
autoConvertToInternalFormat(template: string): string
```

## Usage Examples

### Example 1: Basic Conversion

```typescript
const templateFormatService = new TemplateFormatService();

// Internal format to SMS format
const internalTemplate = 'Hello {{customer_name}}, your EMI is {{amount}}';
const smsTemplate = templateFormatService.convertToSmsFormat(internalTemplate);
// Result: "Hello {#var#}, your EMI is {#var#}"

// SMS format to internal format
const smsTemplate = 'Hello {#var#}, your EMI is {#var#}';
const internalTemplate = templateFormatService.convertFromSmsFormat(smsTemplate);
// Result: "Hello {{var}}, your EMI is {{var}}"
```

### Example 2: Real-world Scenario

```typescript
// Internal template from our system
const internalTemplate =
  "Hello {{customer_name}}, we're offering a one-time settlement of ₹{{settlement_amount}}. Valid till {{expiry_date}}.";

// Convert to SMS format for external API
const smsTemplate = templateFormatService.convertToSmsFormat(internalTemplate);
// Result: "Hello {#var#}, we're offering a one-time settlement of ₹{#var#}. Valid till {#var#}."

// SMS template from external API
const externalSmsTemplate =
  'URGENT: Your EMI of Rs. {#var#} is bounced. Pay immediately using this link {#var#}. Thank you for your prompt action. Credit Wise Capital.';

// Convert back to internal format
const internalTemplate = templateFormatService.convertFromSmsFormat(externalSmsTemplate);
// Result: "URGENT: Your EMI of Rs. {{var}} is bounced. Pay immediately using this link {{var}}. Thank you for your prompt action. Credit Wise Capital."
```

## Integration Points

### 1. Template Creation

When creating a template through the master-data template service:

```typescript
// In SmsTemplateService.createSmsTemplate()
const smsFormattedMessage = this.templateFormatService.convertToSmsFormat(
  createTemplateDto.messageBody,
);

const smsTemplateData = {
  templateName: createTemplateDto.templateName,
  messageTemplate: smsFormattedMessage, // Converted format
  templateId: tempTemplateId,
};
```

### 2. Template Updates

When updating a template:

```typescript
// In SmsTemplateService.updateSmsTemplate()
const messageToUpdate = updateData.messageBody || template[0].messageBody;
const smsFormattedMessage = this.templateFormatService.convertToSmsFormat(messageToUpdate);

const smsUpdateData = {
  templateName: updateData.templateName || template[0].templateName,
  messageTemplate: smsFormattedMessage, // Converted format
  templateId: template[0].dltTemplateId || `temp_${Date.now()}`,
};
```

### 3. Template Retrieval

When fetching templates from external API:

```typescript
// In SmsTemplateService.getAllSmsTemplates()
const templates = await this.smsApiService.getAllTemplates();

// Convert templates back to internal format for display
return templates.map((template) => ({
  ...template,
  MessageTemplate: this.templateFormatService.convertFromSmsFormat(template.MessageTemplate),
}));
```

## Conversion Rules

### Internal Format → SMS Format

- `{{variable_name}}` → `{#var#}`
- `{{ variable_name }}` → `{#var#}` (handles spaces)
- Multiple variables are all converted to `{#var#}`
- Variable names are not preserved (all become `var`)

### SMS Format → Internal Format

- `{#var#}` → `{{var}}`
- `{#variable#}` → `{{variable}}`
- Variable names are preserved when converting back

## Error Handling

The service includes robust error handling:

- **Null/Undefined Input**: Returns input as-is
- **Empty String**: Returns empty string
- **Invalid Input Type**: Returns input as-is
- **No Variables Found**: Returns template unchanged

## Testing

Comprehensive test suite is available in `template-format.test.ts` covering:

- Basic conversion scenarios
- Edge cases (null, empty, invalid input)
- Real-world examples
- Auto-detection functionality
- Format validation

## Configuration

No additional configuration is required. The service is automatically injected into the SMS template service and is available throughout the master-data module.

## Benefits

1. **Seamless Integration**: Automatic conversion without manual intervention
2. **Backward Compatibility**: Existing templates continue to work
3. **Flexible**: Supports both generic and specific variable name conversions
4. **Robust**: Handles edge cases and error scenarios gracefully
5. **Testable**: Comprehensive test coverage ensures reliability
6. **Maintainable**: Centralized conversion logic in a dedicated service

## Future Enhancements

Potential future improvements could include:

1. **Custom Variable Mapping**: Map specific internal variables to specific SMS variables
2. **Template Validation**: Validate template syntax before conversion
3. **Batch Conversion**: Convert multiple templates at once
4. **Format Detection**: More sophisticated format detection algorithms
5. **Template Preview**: Preview converted templates before sending to external API

## Conclusion

The template format conversion system provides a robust, automatic solution for handling the different template variable formats required by our internal system and the external SMS portal service. This ensures seamless integration while maintaining data consistency and user experience.
