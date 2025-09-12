import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';
import {
  TemplateEngineService,
  TemplateData,
  TemplateRenderRequest,
  TemplateRenderResult,
} from './template-engine.service';
import { DataIngestionHelperService } from './data-ingestion-helper.service';

export interface BorrowerDataSource {
  loanAccountId: string;
  loanAccountNumber: string;
  includePersonalDetails: boolean;
  includeAddressDetails: boolean;
  includeContactDetails: boolean;
  includeFinancialDetails: boolean;
  maskSensitiveData: boolean;
}

export interface RenderingOptions {
  locale: string;
  currency: string;
  dateFormat: string;
  timeZone: string;
  outputFormat: 'HTML' | 'PDF' | 'PLAIN_TEXT';
  includeHeaderFooter: boolean;
  watermark?: string;
  customCSS?: string;
  printReady: boolean;
}

export interface DocumentMetadata {
  documentId: string;
  documentType: string;
  generatedFor: string;
  generatedBy: string;
  generationTimestamp: Date;
  templateUsed: string;
  dataVersion: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  retentionPeriod: number; // days
  digitalSignature?: string;
}

export interface EnhancedRenderResult extends TemplateRenderResult {
  documentMetadata: DocumentMetadata;
  dataQuality: {
    completenessScore: number; // 0-100
    accuracyScore: number; // 0-100
    freshnessScore: number; // 0-100
    missingFields: string[];
    outdatedFields: string[];
  };
  complianceCheck: {
    legalRequirements: boolean;
    dataPrivacy: boolean;
    mandatoryDisclosures: boolean;
    languageCompliance: boolean;
    issues: string[];
  };
  deliveryInstructions: {
    primaryMode: string;
    backupModes: string[];
    deliverySchedule: Date;
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    trackingEnabled: boolean;
  };
  auditTrail: {
    dataAccessed: string[];
    templatesUsed: string[];
    userPermissions: string[];
    securityLevel: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

@Injectable()
export class TemplateRenderingService {
  private readonly logger = new Logger(TemplateRenderingService.name);

  constructor(
    @Inject('DRIZZLE')
    private readonly db: any,
    private readonly templateEngine: TemplateEngineService,
    private readonly dataIngestionHelper: DataIngestionHelperService,
  ) {}

  /**
   * RENDER NOTICE WITH BORROWER DATA
   * Enhanced rendering with comprehensive borrower and loan data integration
   */
  async renderNoticeWithBorrowerData(
    templateId: string,
    dataSource: BorrowerDataSource,
    options: RenderingOptions,
    customVariables?: Record<string, any>,
  ): Promise<EnhancedRenderResult> {
    this.logger.log(`Rendering notice for loan account: ${dataSource.loanAccountNumber}`);

    try {
      // Step 1: Gather comprehensive borrower and loan data
      const templateData = await this.gatherComprehensiveData(dataSource);

      // Step 2: Apply data masking if required
      const processedData = this.applyDataMasking(templateData, dataSource.maskSensitiveData);

      // Step 3: Validate data quality
      const dataQuality = this.assessDataQuality(processedData);

      // Step 4: Prepare rendering request
      const renderRequest: TemplateRenderRequest = {
        templateId,
        templateData: processedData,
        outputFormat: options.outputFormat,
        customVariables: {
          ...customVariables,
          renderingOptions: options,
        },
        locale: options.locale,
      };

      // Step 5: Render template
      const renderResult = await this.templateEngine.renderTemplate(renderRequest);

      // Step 6: Perform compliance checks
      const complianceCheck = await this.performComplianceCheck(processedData, renderResult);

      // Step 7: Generate document metadata
      const documentMetadata = this.generateDocumentMetadata(
        templateId,
        dataSource,
        options,
        processedData,
      );

      // Step 8: Create delivery instructions
      const deliveryInstructions = this.createDeliveryInstructions(processedData, options);

      // Step 9: Generate audit trail
      const auditTrail = this.generateAuditTrail(dataSource, templateId, options);

      // Step 10: Enhance with additional features
      const enhancedContent = await this.enhanceContent(
        renderResult.content,
        options,
        documentMetadata,
      );

      const enhancedResult: EnhancedRenderResult = {
        ...renderResult,
        content: enhancedContent,
        documentMetadata,
        dataQuality,
        complianceCheck,
        deliveryInstructions,
        auditTrail,
      };

      this.logger.log(`Notice rendering completed for ${dataSource.loanAccountNumber}`);
      return enhancedResult;
    } catch (error) {
      this.logger.error(`Error rendering notice for ${dataSource.loanAccountNumber}:`, error);
      throw error;
    }
  }

  /**
   * BATCH RENDER NOTICES for multiple accounts
   */
  async batchRenderNotices(
    templateId: string,
    dataSources: BorrowerDataSource[],
    options: RenderingOptions,
  ): Promise<EnhancedRenderResult[]> {
    this.logger.log(`Starting batch rendering for ${dataSources.length} accounts`);

    const results: EnhancedRenderResult[] = [];
    const batchSize = 5; // Process in smaller batches to prevent overwhelming

    for (let i = 0; i < dataSources.length; i += batchSize) {
      const batch = dataSources.slice(i, i + batchSize);

      const batchPromises = batch.map(async (dataSource) => {
        try {
          return await this.renderNoticeWithBorrowerData(templateId, dataSource, options);
        } catch (error) {
          this.logger.error(`Failed to render notice for ${dataSource.loanAccountNumber}:`, error);
          throw error;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.error(
            `Batch rendering failed for account ${batch[index].loanAccountNumber}:`,
            result.reason,
          );
        }
      });

      // Brief pause between batches
      if (i + batchSize < dataSources.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    this.logger.log(
      `Batch rendering completed: ${results.length}/${dataSources.length} successful`,
    );
    return results;
  }

  /**
   * RENDER PERSONALIZED TEMPLATE with dynamic content adaptation
   */
  async renderPersonalizedTemplate(
    baseTemplateId: string,
    personalizationRules: Record<string, any>,
    dataSource: BorrowerDataSource,
    options: RenderingOptions,
  ): Promise<EnhancedRenderResult> {
    try {
      // Step 1: Get base template
      const baseTemplate = await this.getTemplate(baseTemplateId);

      // Step 2: Apply personalization rules
      const personalizedContent = this.applyPersonalizationRules(
        baseTemplate.templateContent,
        personalizationRules,
        dataSource,
      );

      // Step 3: Create dynamic template
      const dynamicTemplateId = await this.templateEngine.createDynamicTemplate(
        `Personalized-${baseTemplateId}-${Date.now()}`,
        personalizedContent,
        'Personalized Notice',
        { baseTemplate: baseTemplateId, personalizationRules },
      );

      // Step 4: Render with personalized template
      const result = await this.renderNoticeWithBorrowerData(
        dynamicTemplateId,
        dataSource,
        options,
      );

      this.logger.log(`Personalized template rendered for ${dataSource.loanAccountNumber}`);
      return result;
    } catch (error) {
      this.logger.error('Error rendering personalized template:', error);
      throw error;
    }
  }

  /**
   * GATHER COMPREHENSIVE DATA from multiple sources
   */
  private async gatherComprehensiveData(dataSource: BorrowerDataSource): Promise<TemplateData> {
    try {
      // Get loan account details
      const loanAccount = await this.getLoanAccountData(dataSource.loanAccountId);

      // Get borrower details from loan account (assuming borrower data is in loan account)
      const borrowerData = this.extractBorrowerData(loanAccount, dataSource);

      // Generate notice information
      const noticeData = await this.generateNoticeData(dataSource);

      // Get legal entity information
      const legalData = await this.getLegalEntityData();

      // Calculate financial information
      const calculationsData = this.calculateFinancialData(loanAccount);

      // System information
      const systemData = this.getSystemData();

      const templateData: TemplateData = {
        borrower: borrowerData,
        loanAccount: {
          accountNumber: loanAccount.accountNumber,
          productType: loanAccount.productType,
          productName: loanAccount.productSubtype || loanAccount.productType,
          branchName: loanAccount.branchCode, // Would map to actual branch name
          branchCode: loanAccount.branchCode,
          sanctionAmount: parseFloat(loanAccount.sanctionAmount?.toString() || '0'),
          outstandingAmount: parseFloat(loanAccount.outstandingAmount?.toString() || '0'),
          principalOutstanding: parseFloat(loanAccount.principalOutstanding?.toString() || '0'),
          interestOutstanding: parseFloat(loanAccount.interestOutstanding?.toString() || '0'),
          penaltyAmount: parseFloat(loanAccount.penaltyAmount?.toString() || '0'),
          totalDue: parseFloat(loanAccount.totalAmountDue?.toString() || '0'),
          dpdDays: loanAccount.dpdDays,
          lastPaymentDate: loanAccount.lastPaymentDate,
          lastPaymentAmount: parseFloat(loanAccount.lastPaymentAmount?.toString() || '0'),
          emi: parseFloat(loanAccount.emi?.toString() || '0'),
          sanctionDate: loanAccount.sanctionDate,
          maturityDate: loanAccount.maturityDate,
        },
        notice: noticeData,
        legal: legalData,
        calculations: calculationsData,
        system: systemData,
      };

      return templateData;
    } catch (error) {
      this.logger.error('Error gathering comprehensive data:', error);
      throw error;
    }
  }

  /**
   * GET LOAN ACCOUNT DATA
   */
  private async getLoanAccountData(loanAccountNumber: string): Promise<any> {
    // Use the data ingestion helper service instead of direct queries
    // This avoids the field validation format table dependency
    const borrowerData = await this.dataIngestionHelper.getBorrowerData(loanAccountNumber);

    // Transform the borrower data to the expected format
    return {
      'Loan Account Number': borrowerData.loanAccountNumber,
      'Full Name': borrowerData.borrowerName,
      'Mobile Number': borrowerData.borrowerMobile,
      Email: borrowerData.borrowerEmail,
      Address: borrowerData.borrowerAddress,
      'Loan Amount': borrowerData.loanAmount,
      Amount: borrowerData.outstandingAmount,
      'Current DPD': borrowerData.currentDpd?.toString(),
      'Product Type': borrowerData.productType,
      'Branch Code': borrowerData.branchCode,
    };
  }

  /**
   * EXTRACT BORROWER DATA from loan account
   */
  private extractBorrowerData(loanAccount: any, dataSource: BorrowerDataSource): any {
    const borrowerData: any = {
      name: loanAccount.borrowerName,
      firstName: loanAccount.borrowerName?.split(' ')[0] || '',
      lastName: loanAccount.borrowerName?.split(' ').slice(-1)[0] || '',
    };

    if (dataSource.includeContactDetails) {
      borrowerData.phone = loanAccount.phoneNumber || '';
      borrowerData.email = loanAccount.emailId || '';
    }

    if (dataSource.includeAddressDetails) {
      borrowerData.address = {
        line1: loanAccount.address || '',
        city: loanAccount.city || '',
        state: loanAccount.state || '',
        pincode: loanAccount.pincode || '',
        country: 'India',
      };
    }

    return borrowerData;
  }

  /**
   * GENERATE NOTICE DATA
   */
  private async generateNoticeData(dataSource: BorrowerDataSource): Promise<any> {
    // Generate notice code using existing sequence logic
    const noticeCode = await this.generateNoticeCode();

    return {
      noticeCode,
      noticeType: 'Pre-Legal Notice',
      generationDate: new Date(),
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      legalEntityName: 'CollectPro Recovery Services',
      issuedBy: 'Legal Officer',
      issuerDesignation: 'Senior Legal Executive',
      communicationModes: ['Email', 'SMS'],
    };
  }

  /**
   * GET LEGAL ENTITY DATA
   */
  private async getLegalEntityData(): Promise<any> {
    // In production, this would fetch from a legal entities/company configuration table
    return {
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
      legalNoticeReference: `LNR/2025/${String(Date.now()).slice(-6)}`,
    };
  }

  /**
   * CALCULATE FINANCIAL DATA
   */
  private calculateFinancialData(loanAccount: any): any {
    const principalOutstanding = parseFloat(loanAccount.principalOutstanding?.toString() || '0');
    const interestOutstanding = parseFloat(loanAccount.interestOutstanding?.toString() || '0');
    const penaltyAmount = parseFloat(loanAccount.penaltyAmount?.toString() || '0');

    return {
      overdueDays: loanAccount.dpdDays,
      overdueAmount: principalOutstanding + interestOutstanding,
      penaltyRate: 2.5, // Configurable
      penaltyAmount,
      lateFees: penaltyAmount * 0.2, // 20% of penalty as late fees
      totalAmountDue: principalOutstanding + interestOutstanding + penaltyAmount,
      minimumPaymentRequired: Math.max(5000, (principalOutstanding + interestOutstanding) * 0.1),
      gracePeriodDays: 15,
      gracePeriodEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * GET SYSTEM DATA
   */
  private getSystemData(): any {
    return {
      currentDate: new Date(),
      currentTime: new Date().toLocaleTimeString('en-IN'),
      systemReference: `SYS-${Date.now()}`,
      templateVersion: '2.0',
      locale: 'en-IN',
      currency: 'INR',
    };
  }

  /**
   * APPLY DATA MASKING for sensitive information
   */
  private applyDataMasking(data: TemplateData, maskSensitive: boolean): TemplateData {
    if (!maskSensitive) return data;

    const maskedData = { ...data };

    // Mask phone number
    if (maskedData.borrower?.phone) {
      maskedData.borrower.phone = maskedData.borrower.phone.replace(
        /(\d{2})(\d{4})(\d{4})/,
        '$1****$3',
      );
    }

    // Mask email
    if (maskedData.borrower?.email) {
      const [user, domain] = maskedData.borrower.email.split('@');
      maskedData.borrower.email = `${user.slice(0, 2)}****@${domain}`;
    }

    // Mask PAN number
    if (maskedData.borrower?.panNumber) {
      maskedData.borrower.panNumber = maskedData.borrower.panNumber.replace(
        /(.{3})(.{4})(.{3})/,
        '$1****$3',
      );
    }

    // Mask Aadhar number
    if (maskedData.borrower?.aadharNumber) {
      maskedData.borrower.aadharNumber = maskedData.borrower.aadharNumber.replace(
        /(\d{4})\s?(\d{4})\s?(\d{4})/,
        '$1 **** $3',
      );
    }

    return maskedData;
  }

  /**
   * ASSESS DATA QUALITY
   */
  private assessDataQuality(data: TemplateData): any {
    const requiredFields = [
      'borrower.name',
      'borrower.phone',
      'loanAccount.accountNumber',
      'loanAccount.outstandingAmount',
      'notice.noticeCode',
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = this.getNestedProperty(data, field);
      return !value || value === '';
    });

    const completenessScore = Math.round(
      ((requiredFields.length - missingFields.length) / requiredFields.length) * 100,
    );

    // Check data freshness (simplified)
    const dataAge = Date.now() - (data.loanAccount.lastPaymentDate?.getTime() || 0);
    const daysSinceLastPayment = Math.floor(dataAge / (1000 * 60 * 60 * 24));
    const freshnessScore = Math.max(0, 100 - daysSinceLastPayment * 2); // Decrease by 2 points per day

    return {
      completenessScore,
      accuracyScore: 95, // Would implement actual accuracy checks
      freshnessScore,
      missingFields,
      outdatedFields: daysSinceLastPayment > 30 ? ['lastPaymentDate'] : [],
    };
  }

  /**
   * PERFORM COMPLIANCE CHECK
   */
  private async performComplianceCheck(
    data: TemplateData,
    renderResult: TemplateRenderResult,
  ): Promise<any> {
    const issues: string[] = [];

    // Check mandatory fields
    const mandatoryFields = ['borrower.name', 'loanAccount.accountNumber', 'notice.noticeCode'];
    const missingMandatory = mandatoryFields.filter(
      (field) => !this.getNestedProperty(data, field),
    );

    if (missingMandatory.length > 0) {
      issues.push(`Missing mandatory fields: ${missingMandatory.join(', ')}`);
    }

    // Check content length
    if (renderResult.characterCount > 2000) {
      issues.push('Content exceeds recommended character limit');
    }

    return {
      legalRequirements: missingMandatory.length === 0,
      dataPrivacy: true, // Would implement actual privacy checks
      mandatoryDisclosures: true, // Would check for required legal disclosures
      languageCompliance: true, // Would check for appropriate language
      issues,
    };
  }

  /**
   * GENERATE DOCUMENT METADATA
   */
  private generateDocumentMetadata(
    templateId: string,
    dataSource: BorrowerDataSource,
    options: RenderingOptions,
    data: TemplateData,
  ): DocumentMetadata {
    return {
      documentId: `DOC-${Date.now()}`,
      documentType: 'Pre-Legal Notice',
      generatedFor: data.borrower.name,
      generatedBy: 'Template Rendering Service',
      generationTimestamp: new Date(),
      templateUsed: templateId,
      dataVersion: '1.0',
      classification: 'CONFIDENTIAL',
      retentionPeriod: 2555, // 7 years in days
    };
  }

  /**
   * CREATE DELIVERY INSTRUCTIONS
   */
  private createDeliveryInstructions(data: TemplateData, options: RenderingOptions): any {
    return {
      primaryMode: 'Email',
      backupModes: ['SMS', 'Courier'],
      deliverySchedule: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      urgencyLevel: data.loanAccount.dpdDays > 90 ? 'HIGH' : 'MEDIUM',
      trackingEnabled: true,
    };
  }

  /**
   * GENERATE AUDIT TRAIL
   */
  private generateAuditTrail(
    dataSource: BorrowerDataSource,
    templateId: string,
    options: RenderingOptions,
  ): any {
    return {
      dataAccessed: ['loan_accounts', 'legal_notice_templates', 'borrower_profiles'],
      templatesUsed: [templateId],
      userPermissions: ['notice_generation', 'borrower_data_access'],
      securityLevel: 'CONFIDENTIAL',
    };
  }

  /**
   * ENHANCE CONTENT with additional features
   */
  private async enhanceContent(
    content: string,
    options: RenderingOptions,
    metadata: DocumentMetadata,
  ): Promise<string> {
    let enhancedContent = content;

    // Add watermark if specified
    if (options.watermark) {
      enhancedContent = this.addWatermark(enhancedContent, options.watermark);
    }

    // Add custom CSS
    if (options.customCSS) {
      enhancedContent = this.addCustomCSS(enhancedContent, options.customCSS);
    }

    // Add document metadata footer
    if (options.includeHeaderFooter) {
      enhancedContent = this.addDocumentFooter(enhancedContent, metadata);
    }

    return enhancedContent;
  }

  /**
   * HELPER METHODS
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

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

  private async generateNoticeCode(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = Math.floor(Math.random() * 999) + 1;
    return `PLN-${today}-${sequence.toString().padStart(3, '0')}`;
  }

  private applyPersonalizationRules(
    content: string,
    rules: Record<string, any>,
    dataSource: BorrowerDataSource,
  ): string {
    let personalizedContent = content;

    // Apply personalization rules (simplified implementation)
    Object.entries(rules).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      personalizedContent = personalizedContent.replace(new RegExp(placeholder, 'g'), value);
    });

    return personalizedContent;
  }

  private addWatermark(content: string, watermark: string): string {
    const watermarkStyle = `
      <style>
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 48px;
          color: rgba(0,0,0,0.1);
          z-index: -1;
          pointer-events: none;
        }
      </style>
      <div class="watermark">${watermark}</div>
    `;

    return content.replace('</head>', `${watermarkStyle}</head>`);
  }

  private addCustomCSS(content: string, customCSS: string): string {
    return content.replace('</head>', `<style>${customCSS}</style></head>`);
  }

  private addDocumentFooter(content: string, metadata: DocumentMetadata): string {
    const footer = `
      <div class="document-footer" style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 10px; color: #666;">
        <p>Document ID: ${metadata.documentId} | Generated: ${metadata.generationTimestamp.toLocaleString('en-IN')} | Classification: ${metadata.classification}</p>
        <p>This is a computer-generated document and does not require physical signature.</p>
      </div>
    `;

    return content.replace('</body>', `${footer}</body>`);
  }
}
