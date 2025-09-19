import { Injectable } from '@nestjs/common';
const striptags = require('striptags');

@Injectable()
export class StripHtmlService {
  /**
   * Remove HTML tags from content while preserving text content
   * @param content - HTML content to clean
   * @returns Plain text content without HTML tags
   */
  clean(content: string): string {
    if (!content) {
      return '';
    }

    // Strip HTML tags and normalize whitespace
    const cleaned = striptags(content);

    // Normalize whitespace - replace multiple spaces/newlines with single space
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if content contains HTML tags
   * @param content - Content to check
   * @returns True if content contains HTML tags
   */
  hasHtmlTags(content: string): boolean {
    if (!content) {
      return false;
    }

    // Simple regex to detect HTML tags
    const htmlTagRegex = /<[^>]*>/;
    return htmlTagRegex.test(content);
  }

  /**
   * Clean content and log the transformation for debugging
   * @param content - HTML content to clean
   * @param context - Context for logging (e.g., 'template creation', 'template update')
   * @returns Plain text content without HTML tags
   */
  cleanWithLogging(content: string, context: string = 'template processing'): string {
    if (!content) {
      return '';
    }

    const hasHtml = this.hasHtmlTags(content);
    const cleaned = this.clean(content);

    if (hasHtml) {
      console.log(`[StripHtmlService] ${context}:`);
      console.log(`  Original: ${content}`);
      console.log(`  Cleaned:  ${cleaned}`);
    }

    return cleaned;
  }
}
