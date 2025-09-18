import { TemplateFormatService } from './template-format.service';

describe('TemplateFormatService', () => {
  let service: TemplateFormatService;

  beforeEach(() => {
    service = new TemplateFormatService();
  });

  describe('convertToSmsFormat', () => {
    it('should convert {{var}} to {#var#}', () => {
      const template = 'Hello {{customer_name}}, your EMI is {{amount}}';
      const result = service.convertToSmsFormat(template);
      expect(result).toBe('Hello {#var#}, your EMI is {#var#}');
    });

    it('should handle templates with spaces around variables', () => {
      const template = 'Hello {{ customer_name }}, your EMI is {{ amount }}';
      const result = service.convertToSmsFormat(template);
      expect(result).toBe('Hello {#var#}, your EMI is {#var#}');
    });

    it('should handle templates without variables', () => {
      const template = 'Hello customer, your EMI is due';
      const result = service.convertToSmsFormat(template);
      expect(result).toBe('Hello customer, your EMI is due');
    });

    it('should handle empty or null templates', () => {
      expect(service.convertToSmsFormat('')).toBe('');
      expect(service.convertToSmsFormat(null as any)).toBe(null);
      expect(service.convertToSmsFormat(undefined as any)).toBe(undefined);
    });
  });

  describe('convertFromSmsFormat', () => {
    it('should convert {#var#} to {{var}}', () => {
      const template = 'Hello {#var#}, your EMI is {#var#}';
      const result = service.convertFromSmsFormat(template);
      expect(result).toBe('Hello {{var}}, your EMI is {{var}}');
    });

    it('should handle templates without variables', () => {
      const template = 'Hello customer, your EMI is due';
      const result = service.convertFromSmsFormat(template);
      expect(result).toBe('Hello customer, your EMI is due');
    });
  });

  describe('convertToGenericSmsFormat', () => {
    it('should convert {{var}} to {#var#} preserving variable names', () => {
      const template = 'Hello {{customer_name}}, your EMI is {{amount}}';
      const result = service.convertToGenericSmsFormat(template);
      expect(result).toBe('Hello {#customer_name#}, your EMI is {#amount#}');
    });
  });

  describe('convertFromGenericSmsFormat', () => {
    it('should convert {#var#} to {{var}} preserving variable names', () => {
      const template = 'Hello {#customer_name#}, your EMI is {#amount#}';
      const result = service.convertFromGenericSmsFormat(template);
      expect(result).toBe('Hello {{customer_name}}, your EMI is {{amount}}');
    });
  });

  describe('isInternalFormat', () => {
    it('should detect internal format {{var}}', () => {
      expect(service.isInternalFormat('Hello {{customer_name}}')).toBe(true);
      expect(service.isInternalFormat('Hello customer')).toBe(false);
      expect(service.isInternalFormat('Hello {#var#}')).toBe(false);
    });
  });

  describe('isSmsApiFormat', () => {
    it('should detect SMS API format {#var#}', () => {
      expect(service.isSmsApiFormat('Hello {#var#}')).toBe(true);
      expect(service.isSmsApiFormat('Hello customer')).toBe(false);
      expect(service.isSmsApiFormat('Hello {{var}}')).toBe(false);
    });
  });

  describe('autoConvertToSmsFormat', () => {
    it('should auto-convert internal format to SMS format', () => {
      const template = 'Hello {{customer_name}}, your EMI is {{amount}}';
      const result = service.autoConvertToSmsFormat(template);
      expect(result).toBe('Hello {#var#}, your EMI is {#var#}');
    });

    it('should leave SMS format unchanged', () => {
      const template = 'Hello {#var#}, your EMI is {#var#}';
      const result = service.autoConvertToSmsFormat(template);
      expect(result).toBe('Hello {#var#}, your EMI is {#var#}');
    });

    it('should leave templates without variables unchanged', () => {
      const template = 'Hello customer, your EMI is due';
      const result = service.autoConvertToSmsFormat(template);
      expect(result).toBe('Hello customer, your EMI is due');
    });
  });

  describe('autoConvertToInternalFormat', () => {
    it('should auto-convert SMS format to internal format', () => {
      const template = 'Hello {#var#}, your EMI is {#var#}';
      const result = service.autoConvertToInternalFormat(template);
      expect(result).toBe('Hello {{var}}, your EMI is {{var}}');
    });

    it('should leave internal format unchanged', () => {
      const template = 'Hello {{customer_name}}, your EMI is {{amount}}';
      const result = service.autoConvertToInternalFormat(template);
      expect(result).toBe('Hello {{customer_name}}, your EMI is {{amount}}');
    });
  });

  describe('Real-world examples', () => {
    it('should handle the provided example correctly', () => {
      const internalTemplate =
        "Hello {{customer_name}}, we're offering a one-time settlement of ₹{{settlement_amount}}. Valid till {{expiry_date}}.";
      const smsTemplate =
        'URGENT: Your EMI of Rs. {#var#} is bounced. Pay immediately using this link {#var#}. Thank you for your prompt action. Credit Wise Capital.';

      // Convert internal to SMS format
      const convertedToSms = service.convertToSmsFormat(internalTemplate);
      expect(convertedToSms).toBe(
        "Hello {#var#}, we're offering a one-time settlement of ₹{#var#}. Valid till {#var#}.",
      );

      // Convert SMS to internal format
      const convertedToInternal = service.convertFromSmsFormat(smsTemplate);
      expect(convertedToInternal).toBe(
        'URGENT: Your EMI of Rs. {{var}} is bounced. Pay immediately using this link {{var}}. Thank you for your prompt action. Credit Wise Capital.',
      );
    });
  });
});
