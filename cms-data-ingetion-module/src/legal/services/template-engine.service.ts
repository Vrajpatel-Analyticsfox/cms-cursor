import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';
import * as Handlebars from 'handlebars';
import moment from 'moment';

export interface TemplateData {
  // Borrower Information
  borrower: {
    name: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    title?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
    phone: string;
    email: string;
    panNumber?: string;
    aadharNumber?: string;
  };

  // Loan Account Information
  loanAccount: {
    accountNumber: string;
    productType: string;
    productName: string;
    branchName: string;
    branchCode: string;
    sanctionAmount: number;
    outstandingAmount: number;
    principalOutstanding: number;
    interestOutstanding: number;
    penaltyAmount: number;
    totalDue: number;
    dpdDays: number;
    lastPaymentDate?: Date;
    lastPaymentAmount?: number;
    emi: number;
    sanctionDate: Date;
    maturityDate: Date;
  };

  // Notice Information
  notice: {
    noticeCode: string;
    noticeType: string;
    generationDate: Date;
    expiryDate: Date;
    dueDate: Date;
    legalEntityName: string;
    issuedBy: string;
    issuerDesignation: string;
    communicationModes: string[];
  };

  // Legal Information
  legal: {
    companyName: string;
    companyAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
    registeredOffice: string;
    cin: string;
    authorizedOfficer: {
      name: string;
      designation: string;
      contactNumber: string;
      email: string;
    };
    legalNoticeReference: string;
  };

  // Calculation Information
  calculations: {
    overdueDays: number;
    overdueAmount: number;
    penaltyRate: number;
    penaltyAmount: number;
    lateFees: number;
    totalAmountDue: number;
    minimumPaymentRequired: number;
    gracePeriodDays: number;
    gracePeriodEndDate: Date;
  };

  // System Information
  system: {
    currentDate: Date;
    currentTime: string;
    systemReference: string;
    templateVersion: string;
    locale: string;
    currency: string;
  };
}

export interface TemplateRenderRequest {
  templateId: string;
  templateData: TemplateData;
  outputFormat: 'HTML' | 'PDF' | 'PLAIN_TEXT';
  customVariables?: Record<string, any>;
  locale?: string;
}

export interface TemplateRenderResult {
  content: string;
  contentType: string;
  characterCount: number;
  wordCount: number;
  estimatedReadingTime: number; // in minutes
  templateInfo: {
    templateId: string;
    templateName: string;
    templateVersion: string;
    lastModified: Date;
  };
  renderMetadata: {
    renderedAt: Date;
    renderDuration: number; // in milliseconds
    outputFormat: string;
    locale: string;
    variablesUsed: string[];
    missingVariables: string[];
  };
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiredVariables: string[];
  optionalVariables: string[];
  estimatedLength: number;
  compliance: {
    characterLimit: boolean;
    mandatoryFields: boolean;
    legalRequirements: boolean;
  };
}

@Injectable()
export class TemplateEngineService {
  private readonly logger = new Logger(TemplateEngineService.name);
  private handlebars: typeof Handlebars;

  constructor(
    @Inject('DRIZZLE')
    private readonly db: any,
  ) {
    this.initializeTemplateEngine();
  }

  /**
   * RENDER TEMPLATE with comprehensive data merging
   */
  async renderTemplate(request: TemplateRenderRequest): Promise<TemplateRenderResult> {
    const startTime = Date.now();
    this.logger.debug(`Rendering template: ${request.templateId}`);

    try {
      // Step 1: Fetch and validate template
      const template = await this.getTemplate(request.templateId);

      // Step 2: Validate template data
      const validation = await this.validateTemplateData(template, request.templateData);
      if (!validation.isValid) {
        throw new BadRequestException(
          `Template validation failed: ${validation.errors.join(', ')}`,
        );
      }

      // Step 3: Prepare template data with system helpers
      const enrichedData = this.enrichTemplateData(request.templateData, request.customVariables);

      // Step 4: Compile and render template
      const compiledTemplate = this.handlebars.compile(template.templateContent);
      const renderedContent = compiledTemplate(enrichedData);

      // Step 5: Post-process based on output format
      const finalContent = await this.postProcessContent(renderedContent, request.outputFormat);

      // Step 6: Calculate metadata
      const metadata = this.calculateRenderMetadata(
        renderedContent,
        request,
        template,
        startTime,
        enrichedData,
      );

      const result: TemplateRenderResult = {
        content: finalContent,
        contentType: this.getContentType(request.outputFormat),
        characterCount: metadata.characterCount,
        wordCount: metadata.wordCount,
        estimatedReadingTime: metadata.estimatedReadingTime,
        templateInfo: {
          templateId: template.id,
          templateName: template.templateName,
          templateVersion: template.version || '1.0',
          lastModified: template.updatedAt,
        },
        renderMetadata: {
          renderedAt: new Date(),
          renderDuration: Date.now() - startTime,
          outputFormat: request.outputFormat,
          locale: request.locale || 'en-IN',
          variablesUsed: metadata.variablesUsed,
          missingVariables: metadata.missingVariables,
        },
      };

      this.logger.debug(
        `Template rendering completed in ${result.renderMetadata.renderDuration}ms`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error rendering template ${request.templateId}:`, error);
      throw error;
    }
  }

  /**
   * GENERATE TEMPLATE PREVIEW without full data
   */
  async generateTemplatePreview(
    templateId: string,
    sampleData?: Partial<TemplateData>,
  ): Promise<TemplateRenderResult> {
    try {
      const template = await this.getTemplate(templateId);

      // Use sample data or generate mock data
      const previewData = sampleData || this.generateMockTemplateData();

      const request: TemplateRenderRequest = {
        templateId,
        templateData: previewData as TemplateData,
        outputFormat: 'HTML',
        locale: 'en-IN',
      };

      return await this.renderTemplate(request);
    } catch (error) {
      this.logger.error(`Error generating template preview:`, error);
      throw error;
    }
  }

  /**
   * VALIDATE TEMPLATE SYNTAX and requirements
   */
  async validateTemplate(templateId: string): Promise<TemplateValidationResult> {
    try {
      const template = await this.getTemplate(templateId);

      const errors: string[] = [];
      const warnings: string[] = [];
      const requiredVariables: string[] = [];
      const optionalVariables: string[] = [];

      // Parse template for variables
      const variables = this.extractTemplateVariables(template.templateContent);

      // Check template syntax
      try {
        this.handlebars.compile(template.templateContent);
      } catch (syntaxError) {
        errors.push(`Template syntax error: ${syntaxError.message}`);
      }

      // Validate required fields
      const mandatoryFields = [
        'borrower.name',
        'loanAccount.accountNumber',
        'notice.noticeCode',
        'notice.generationDate',
        'legal.companyName',
      ];

      mandatoryFields.forEach((field) => {
        if (!variables.includes(field)) {
          warnings.push(`Missing mandatory field: ${field}`);
        } else {
          requiredVariables.push(field);
        }
      });

      // Check character limits
      const estimatedLength = template.templateContent.length;
      const maxCharacters = template.maxCharacters || 2000;
      const characterLimitOk = estimatedLength <= maxCharacters;

      if (!characterLimitOk) {
        warnings.push(`Template may exceed character limit: ${estimatedLength}/${maxCharacters}`);
      }

      const result: TemplateValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        requiredVariables,
        optionalVariables: variables.filter((v) => !requiredVariables.includes(v)),
        estimatedLength,
        compliance: {
          characterLimit: characterLimitOk,
          mandatoryFields: mandatoryFields.every((field) => variables.includes(field)),
          legalRequirements: true, // Would implement specific legal compliance checks
        },
      };

      return result;
    } catch (error) {
      this.logger.error('Error validating template:', error);
      throw error;
    }
  }

  /**
   * CREATE DYNAMIC TEMPLATE from content
   */
  async createDynamicTemplate(
    templateName: string,
    templateContent: string,
    templateType: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    try {
      // Validate template syntax
      this.handlebars.compile(templateContent);

      // Get default language and channel IDs (you may need to adjust these)
      const defaultLanguageId = 'uuid-default-language';
      const defaultChannelId = 'uuid-default-channel';

      // Create template record
      const template = await this.db
        .insert(schema.legalNoticeTemplates)
        .values({
          templateCode: `DYN-${Date.now()}`,
          templateName,
          templateType: templateType as any,
          templateContent,
          languageId: defaultLanguageId,
          channelId: defaultChannelId,
          isActive: true,
          maxCharacters: templateContent.length + 500, // Allow for data expansion
          description: `Dynamic template: ${templateName}`,
          status: 'active',
          createdBy: 'template-engine-service',
          updatedBy: 'template-engine-service',
        })
        .returning({ id: schema.legalNoticeTemplates.id });

      this.logger.log(`Created dynamic template: ${templateName} (ID: ${template[0].id})`);
      return template[0].id;
    } catch (error) {
      this.logger.error('Error creating dynamic template:', error);
      throw error;
    }
  }

  /**
   * INITIALIZE TEMPLATE ENGINE with custom helpers
   */
  private initializeTemplateEngine(): void {
    this.handlebars = Handlebars.create();

    // Register custom helpers
    this.registerCustomHelpers();

    this.logger.log('Template engine initialized with custom helpers');
  }

  /**
   * REGISTER CUSTOM HANDLEBARS HELPERS
   */
  private registerCustomHelpers(): void {
    // Date formatting helper
    this.handlebars.registerHelper('formatDate', (date: Date, format: string = 'DD/MM/YYYY') => {
      if (!date) return '';
      return moment(date).format(format);
    });

    // Currency formatting helper
    this.handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'INR') => {
      if (typeof amount !== 'number') return '₹0';
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    });

    // Number formatting helper
    this.handlebars.registerHelper('formatNumber', (number: number) => {
      if (typeof number !== 'number') return '0';
      return new Intl.NumberFormat('en-IN').format(number);
    });

    // Conditional helpers
    this.handlebars.registerHelper('ifEquals', (arg1, arg2, options) => {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    this.handlebars.registerHelper('ifGreater', (arg1, arg2, options) => {
      return arg1 > arg2 ? options.fn(this) : options.inverse(this);
    });

    // Text helpers
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    this.handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    this.handlebars.registerHelper('titleCase', (str: string) => {
      return str
        ? str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        : '';
    });

    // Calculate days helper
    this.handlebars.registerHelper('daysBetween', (date1: Date, date2: Date) => {
      if (!date1 || !date2) return 0;
      const diffTime = Math.abs(new Date(date2).getTime() - new Date(date1).getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });

    // Add days to date
    this.handlebars.registerHelper('addDays', (date: Date, days: number) => {
      if (!date) return '';
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    });

    // Ordinal number helper
    this.handlebars.registerHelper('ordinal', (num: number) => {
      const suffixes = ['th', 'st', 'nd', 'rd'];
      const v = num % 100;
      return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    });

    // Legal text formatting
    this.handlebars.registerHelper('legalParagraph', (text: string) => {
      return text ? `<p class="legal-text">${text}</p>` : '';
    });

    // Multiple communication modes formatting
    this.handlebars.registerHelper('formatCommunicationModes', (modes: string[]) => {
      if (!modes || modes.length === 0) return '';
      if (modes.length === 1) return modes[0];
      if (modes.length === 2) return modes.join(' and ');
      return modes.slice(0, -1).join(', ') + ', and ' + modes[modes.length - 1];
    });
  }

  /**
   * GET TEMPLATE from database
   */
  private async getTemplate(templateId: string): Promise<any> {
    const template = await this.db
      .select()
      .from(schema.legalNoticeTemplates)
      .where(eq(schema.legalNoticeTemplates.id, templateId))
      .limit(1);

    if (template.length === 0) {
      throw new BadRequestException(`Template ${templateId} not found`);
    }

    return template[0];
  }

  /**
   * VALIDATE TEMPLATE DATA completeness
   */
  private async validateTemplateData(
    template: any,
    data: TemplateData,
  ): Promise<TemplateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required borrower fields
    if (!data.borrower?.name) {
      errors.push('Borrower name is required');
    }

    if (!data.loanAccount?.accountNumber) {
      errors.push('Loan account number is required');
    }

    if (!data.notice?.noticeCode) {
      errors.push('Notice code is required');
    }

    // Check template-specific requirements
    const variables = this.extractTemplateVariables(template.templateContent);

    variables.forEach((variable) => {
      const value = this.getNestedProperty(data, variable);
      if (value === undefined || value === null || value === '') {
        warnings.push(`Missing or empty variable: ${variable}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredVariables: variables,
      optionalVariables: [],
      estimatedLength: template.templateContent.length,
      compliance: {
        characterLimit: true,
        mandatoryFields: errors.length === 0,
        legalRequirements: true,
      },
    };
  }

  /**
   * ENRICH TEMPLATE DATA with calculated fields and helpers
   */
  private enrichTemplateData(
    data: TemplateData,
    customVariables?: Record<string, any>,
  ): TemplateData & Record<string, any> {
    const enriched = {
      ...data,
      ...customVariables,
    };

    // Add calculated fields
    enriched.calculations = {
      ...enriched.calculations,
      totalAmountDue:
        (enriched.loanAccount?.principalOutstanding || 0) +
        (enriched.loanAccount?.interestOutstanding || 0) +
        (enriched.loanAccount?.penaltyAmount || 0),
      gracePeriodEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    };

    // Add system information
    enriched.system = {
      ...enriched.system,
      currentDate: new Date(),
      currentTime: new Date().toLocaleTimeString('en-IN'),
      systemReference: `SYS-${Date.now()}`,
      templateVersion: '2.0',
      locale: 'en-IN',
      currency: 'INR',
    };

    return enriched;
  }

  /**
   * POST-PROCESS CONTENT based on output format
   */
  private async postProcessContent(
    content: string,
    format: 'HTML' | 'PDF' | 'PLAIN_TEXT',
  ): Promise<string> {
    switch (format) {
      case 'HTML':
        return this.wrapHtmlContent(content);

      case 'PLAIN_TEXT':
        return this.stripHtmlTags(content);

      case 'PDF':
        // In production, this would generate PDF using libraries like puppeteer or PDFKit
        return this.wrapHtmlContent(content);

      default:
        return content;
    }
  }

  /**
   * WRAP HTML CONTENT with proper structure
   */
  private wrapHtmlContent(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Legal Notice</title>
    <style>
        body { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            margin: 20px; 
            color: #333; 
        }
        .legal-text { 
            text-align: justify; 
            margin-bottom: 15px; 
        }
        .header { 
            text-align: center; 
            font-weight: bold; 
            margin-bottom: 20px; 
            text-decoration: underline; 
        }
        .footer { 
            margin-top: 30px; 
            border-top: 1px solid #ccc; 
            padding-top: 15px; 
        }
        .amount { 
            font-weight: bold; 
            color: #d9534f; 
        }
        .highlight { 
            background-color: #fff3cd; 
            padding: 2px 4px; 
        }
    </style>
</head>
<body>
    ${content}
    <div class="footer">
        <p><small>This is a system-generated notice. Please contact us for any clarifications.</small></p>
    </div>
</body>
</html>`;
  }

  /**
   * STRIP HTML TAGS for plain text output
   */
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * EXTRACT TEMPLATE VARIABLES using regex
   */
  private extractTemplateVariables(template: string): string[] {
    const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      const variable = match[1].trim();
      // Remove helper functions and get just the variable name
      const cleanVariable = variable.split(' ')[0].replace(/^(#|\/|!|>|&|\{|\})/g, '');
      if (cleanVariable && !variables.includes(cleanVariable)) {
        variables.push(cleanVariable);
      }
    }

    return variables;
  }

  /**
   * GET NESTED PROPERTY from object using dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * CALCULATE RENDER METADATA
   */
  private calculateRenderMetadata(
    content: string,
    request: TemplateRenderRequest,
    template: any,
    startTime: number,
    data: any,
  ): any {
    const characterCount = content.length;
    const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 words per minute

    const variablesUsed = this.extractTemplateVariables(template.templateContent).filter(
      (variable) => this.getNestedProperty(data, variable) !== undefined,
    );

    const missingVariables = this.extractTemplateVariables(template.templateContent).filter(
      (variable) => this.getNestedProperty(data, variable) === undefined,
    );

    return {
      characterCount,
      wordCount,
      estimatedReadingTime,
      variablesUsed,
      missingVariables,
    };
  }

  /**
   * GET CONTENT TYPE based on output format
   */
  private getContentType(format: 'HTML' | 'PDF' | 'PLAIN_TEXT'): string {
    switch (format) {
      case 'HTML':
        return 'text/html';
      case 'PDF':
        return 'application/pdf';
      case 'PLAIN_TEXT':
        return 'text/plain';
      default:
        return 'text/plain';
    }
  }

  /**
   * GENERATE MOCK TEMPLATE DATA for previews
   */
  private generateMockTemplateData(): TemplateData {
    return {
      borrower: {
        name: 'Mr. Rajesh Kumar Singh',
        firstName: 'Rajesh',
        lastName: 'Singh',
        middleName: 'Kumar',
        title: 'Mr.',
        address: {
          line1: '123, MG Road',
          line2: 'Near City Centre',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        },
        phone: '+91-9876543210',
        email: 'rajesh.singh@example.com',
        panNumber: 'ABCDE1234F',
        aadharNumber: '1234 5678 9012',
      },
      loanAccount: {
        accountNumber: 'LN4567890123',
        productType: 'Personal Loan',
        productName: 'Quick Personal Loan',
        branchName: 'Mumbai Central Branch',
        branchCode: 'MBC001',
        sanctionAmount: 500000,
        outstandingAmount: 387500,
        principalOutstanding: 350000,
        interestOutstanding: 25000,
        penaltyAmount: 12500,
        totalDue: 387500,
        dpdDays: 65,
        lastPaymentDate: new Date('2024-10-15'),
        lastPaymentAmount: 15000,
        emi: 15000,
        sanctionDate: new Date('2023-01-15'),
        maturityDate: new Date('2026-01-15'),
      },
      notice: {
        noticeCode: 'PLN-20250115-001',
        noticeType: 'Pre-Legal Notice',
        generationDate: new Date(),
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        legalEntityName: 'CollectPro Recovery Services',
        issuedBy: 'Legal Officer - Priya Sharma',
        issuerDesignation: 'Senior Legal Executive',
        communicationModes: ['Email', 'SMS', 'Courier'],
      },
      legal: {
        companyName: 'ABC Financial Services Ltd.',
        companyAddress: {
          line1: 'Corporate Office, Tower A',
          line2: 'Business District',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400051',
        },
        registeredOffice: 'Mumbai, Maharashtra',
        cin: 'U65923MH2015PLC123456',
        authorizedOfficer: {
          name: 'Ms. Priya Sharma',
          designation: 'Senior Legal Executive',
          contactNumber: '+91-9876543210',
          email: 'legal@abcfinancial.com',
        },
        legalNoticeReference: 'LNR/2025/001',
      },
      calculations: {
        overdueDays: 65,
        overdueAmount: 387500,
        penaltyRate: 2.5,
        penaltyAmount: 12500,
        lateFees: 2500,
        totalAmountDue: 387500,
        minimumPaymentRequired: 50000,
        gracePeriodDays: 15,
        gracePeriodEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
      system: {
        currentDate: new Date(),
        currentTime: new Date().toLocaleTimeString('en-IN'),
        systemReference: 'SYS-20250115-001',
        templateVersion: '2.0',
        locale: 'en-IN',
        currency: 'INR',
      },
    };
  }
}
