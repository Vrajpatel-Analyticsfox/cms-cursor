import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateFormatService {
  /**
   * Convert template variables from internal format {{var}} to SMS API format {#var#}
   *
   * @param template - Template string with {{variable}} format
   * @returns Template string with {#var#} format
   *
   * @example
   * convertToSmsFormat("Hello {{customer_name}}, your EMI is {{amount}}")
   * // Returns: "Hello {#var#}, your EMI is {#var#}"
   */
  convertToSmsFormat(template: string): string {
    if (!template || typeof template !== 'string') {
      return template;
    }

    return template.replace(/{{\s*([^}]+)\s*}}/g, '{#var#}');
  }

  /**
   * Convert template variables from SMS API format {#var#} to internal format {{var}}
   *
   * @param template - Template string with {#var#} format
   * @returns Template string with {{variable}} format
   *
   * @example
   * convertFromSmsFormat("Hello {#var#}, your EMI is {#var#}")
   * // Returns: "Hello {{var}}, your EMI is {{var}}"
   */
  convertFromSmsFormat(template: string): string {
    if (!template || typeof template !== 'string') {
      return template;
    }

    return template.replace(/\{#([^}]+)#\}/g, '{{$1}}');
  }

  /**
   * Convert template variables from internal format {{var}} to generic {#var#} format
   * This is a more flexible version that preserves variable names
   *
   * @param template - Template string with {{variable}} format
   * @returns Template string with {#variable#} format
   *
   * @example
   * convertToGenericSmsFormat("Hello {{customer_name}}, your EMI is {{amount}}")
   * // Returns: "Hello {#customer_name#}, your EMI is {#amount#}"
   */
  convertToGenericSmsFormat(template: string): string {
    if (!template || typeof template !== 'string') {
      return template;
    }

    return template.replace(/{{\s*([^}]+)\s*}}/g, '{#$1#}');
  }

  /**
   * Convert template variables from generic {#var#} format to internal format {{var}}
   *
   * @param template - Template string with {#variable#} format
   * @returns Template string with {{variable}} format
   *
   * @example
   * convertFromGenericSmsFormat("Hello {#customer_name#}, your EMI is {#amount#}")
   * // Returns: "Hello {{customer_name}}, your EMI is {{amount}}"
   */
  convertFromGenericSmsFormat(template: string): string {
    if (!template || typeof template !== 'string') {
      return template;
    }

    return template.replace(/\{#([^}]+)#\}/g, '{{$1}}');
  }

  /**
   * Detect if a template uses internal format {{var}}
   *
   * @param template - Template string to check
   * @returns true if template uses internal format
   */
  isInternalFormat(template: string): boolean {
    if (!template || typeof template !== 'string') {
      return false;
    }

    return /{{\s*[^}]+\s*}}/.test(template);
  }

  /**
   * Detect if a template uses SMS API format {#var#}
   *
   * @param template - Template string to check
   * @returns true if template uses SMS API format
   */
  isSmsApiFormat(template: string): boolean {
    if (!template || typeof template !== 'string') {
      return false;
    }

    return /\{#[^}]+#\}/.test(template);
  }

  /**
   * Auto-convert template to SMS API format
   * Detects the current format and converts appropriately
   *
   * @param template - Template string in any format
   * @returns Template string in SMS API format
   */
  autoConvertToSmsFormat(template: string): string {
    if (!template || typeof template !== 'string') {
      return template;
    }

    if (this.isInternalFormat(template)) {
      return this.convertToSmsFormat(template);
    }

    if (this.isSmsApiFormat(template)) {
      return template; // Already in SMS format
    }

    return template; // No variables detected, return as-is
  }

  /**
   * Auto-convert template to internal format
   * Detects the current format and converts appropriately
   *
   * @param template - Template string in any format
   * @returns Template string in internal format
   */
  autoConvertToInternalFormat(template: string): string {
    if (!template || typeof template !== 'string') {
      return template;
    }

    if (this.isSmsApiFormat(template)) {
      return this.convertFromSmsFormat(template);
    }

    if (this.isInternalFormat(template)) {
      return template; // Already in internal format
    }

    return template; // No variables detected, return as-is
  }
}
