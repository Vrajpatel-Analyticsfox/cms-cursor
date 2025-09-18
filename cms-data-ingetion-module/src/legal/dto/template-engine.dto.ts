import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OutputFormat {
  HTML = 'HTML',
  PDF = 'PDF',
  PLAIN_TEXT = 'PLAIN_TEXT',
}

export enum DocumentClassification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
}

export class TemplateRenderRequestDto {
  @ApiProperty({
    description: 'Template ID to render',
    example: 'template-60dpd-standard-001',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Output format for the rendered content',
    enum: OutputFormat,
    example: OutputFormat.HTML,
  })
  @IsEnum(OutputFormat)
  outputFormat: OutputFormat;

  @ApiProperty({
    description: 'Locale for rendering',
    example: 'en-IN',
    required: false,
  })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({
    description: 'Custom variables to include in template data',
    example: {
      companyLogo: 'https://example.com/logo.png',
      customMessage: 'Please contact us immediately',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customVariables?: Record<string, any>;

  @ApiProperty({
    description: 'Template data for rendering',
    example: {
      borrower: {
        name: 'Mr. Rajesh Kumar Singh',
        phone: '+91-9876543210',
        email: 'rajesh.singh@example.com',
      },
      loanAccount: {
        accountNumber: 'LN4567890',
        outstandingAmount: 387500,
        dpdDays: 65,
      },
    },
  })
  @IsObject()
  templateData: any;
}

export class BorrowerDataSourceDto {
  @ApiProperty({
    description: 'Loan account ID',
    example: 'uuid-loan-account-id',
  })
  @IsString()
  loanAccountId: string;

  @ApiProperty({
    description: 'Loan account number',
    example: 'LN4567890',
  })
  @IsString()
  loanAccountNumber: string;

  @ApiProperty({
    description: 'Include personal details in rendering',
    example: true,
  })
  @IsBoolean()
  includePersonalDetails: boolean;

  @ApiProperty({
    description: 'Include address details in rendering',
    example: true,
  })
  @IsBoolean()
  includeAddressDetails: boolean;

  @ApiProperty({
    description: 'Include contact details in rendering',
    example: true,
  })
  @IsBoolean()
  includeContactDetails: boolean;

  @ApiProperty({
    description: 'Include financial details in rendering',
    example: true,
  })
  @IsBoolean()
  includeFinancialDetails: boolean;

  @ApiProperty({
    description: 'Mask sensitive data',
    example: false,
  })
  @IsBoolean()
  maskSensitiveData: boolean;
}

export class RenderingOptionsDto {
  @ApiProperty({
    description: 'Locale for rendering',
    example: 'en-IN',
  })
  @IsString()
  locale: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Date format',
    example: 'DD/MM/YYYY',
  })
  @IsString()
  dateFormat: string;

  @ApiProperty({
    description: 'Time zone',
    example: 'Asia/Kolkata',
  })
  @IsString()
  timeZone: string;

  @ApiProperty({
    description: 'Output format',
    enum: OutputFormat,
    example: OutputFormat.HTML,
  })
  @IsEnum(OutputFormat)
  outputFormat: OutputFormat;

  @ApiProperty({
    description: 'Include header and footer',
    example: true,
  })
  @IsBoolean()
  includeHeaderFooter: boolean;

  @ApiProperty({
    description: 'Watermark text',
    example: 'CONFIDENTIAL',
    required: false,
  })
  @IsOptional()
  @IsString()
  watermark?: string;

  @ApiProperty({
    description: 'Custom CSS styles',
    example: '.custom-class { color: red; }',
    required: false,
  })
  @IsOptional()
  @IsString()
  customCSS?: string;

  @ApiProperty({
    description: 'Optimize for printing',
    example: false,
  })
  @IsBoolean()
  printReady: boolean;
}

export class EnhancedRenderRequestDto {
  @ApiProperty({
    description: 'Template ID to render',
    example: 'template-60dpd-standard-001',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Borrower data source configuration',
    type: BorrowerDataSourceDto,
  })
  dataSource: BorrowerDataSourceDto;

  @ApiProperty({
    description: 'Rendering options',
    type: RenderingOptionsDto,
  })
  options: RenderingOptionsDto;

  @ApiProperty({
    description: 'Custom variables',
    example: {
      urgencyLevel: 'HIGH',
      specialInstructions: 'Handle with priority',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customVariables?: Record<string, any>;
}

export class BatchRenderRequestDto {
  @ApiProperty({
    description: 'Template ID to render',
    example: 'template-60dpd-standard-001',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Array of borrower data sources',
    type: [BorrowerDataSourceDto],
  })
  @IsArray()
  dataSources: BorrowerDataSourceDto[];

  @ApiProperty({
    description: 'Rendering options',
    type: RenderingOptionsDto,
  })
  options: RenderingOptionsDto;
}

export class TemplateValidationResultDto {
  @ApiProperty({
    description: 'Template validation status',
    example: true,
  })
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({
    description: 'Validation errors',
    example: ['Missing required variable: borrower.name'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  errors: string[];

  @ApiProperty({
    description: 'Validation warnings',
    example: ['Template may exceed character limit'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  warnings: string[];

  @ApiProperty({
    description: 'Required template variables',
    example: ['borrower.name', 'loanAccount.accountNumber'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  requiredVariables: string[];

  @ApiProperty({
    description: 'Optional template variables',
    example: ['borrower.middleName', 'customMessage'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  optionalVariables: string[];

  @ApiProperty({
    description: 'Estimated content length',
    example: 1250,
  })
  @IsNumber()
  estimatedLength: number;

  @ApiProperty({
    description: 'Compliance check results',
    example: {
      characterLimit: true,
      mandatoryFields: true,
      legalRequirements: true,
    },
  })
  @IsObject()
  compliance: {
    characterLimit: boolean;
    mandatoryFields: boolean;
    legalRequirements: boolean;
  };
}

export class TemplateRenderResultDto {
  @ApiProperty({
    description: 'Rendered content',
    example: '<html><body><h1>Pre-Legal Notice</h1>...</body></html>',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Content type',
    example: 'text/html',
  })
  @IsString()
  contentType: string;

  @ApiProperty({
    description: 'Character count of rendered content',
    example: 1423,
  })
  @IsNumber()
  characterCount: number;

  @ApiProperty({
    description: 'Word count of rendered content',
    example: 287,
  })
  @IsNumber()
  wordCount: number;

  @ApiProperty({
    description: 'Estimated reading time in minutes',
    example: 2,
  })
  @IsNumber()
  estimatedReadingTime: number;

  @ApiProperty({
    description: 'Template information',
    example: {
      templateId: 'template-60dpd-standard-001',
      templateName: 'Template-60DPD-Standard',
      templateVersion: '1.0',
      lastModified: '2025-01-15T09:00:00Z',
    },
  })
  @IsObject()
  templateInfo: {
    templateId: string;
    templateName: string;
    templateVersion: string;
    lastModified: string;
  };

  @ApiProperty({
    description: 'Rendering metadata',
    example: {
      renderedAt: '2025-01-15T10:30:00Z',
      renderDuration: 234,
      outputFormat: 'HTML',
      locale: 'en-IN',
      variablesUsed: ['borrower.name', 'loanAccount.accountNumber'],
      missingVariables: [],
    },
  })
  @IsObject()
  renderMetadata: {
    renderedAt: string;
    renderDuration: number;
    outputFormat: string;
    locale: string;
    variablesUsed: string[];
    missingVariables: string[];
  };
}

export class EnhancedRenderResultDto extends TemplateRenderResultDto {
  @ApiProperty({
    description: 'Document metadata',
    example: {
      documentId: 'DOC-1642678800000',
      documentType: 'Pre-Legal Notice',
      generatedFor: 'Mr. Rajesh Kumar Singh',
      generatedBy: 'Template Rendering Service',
      generationTimestamp: '2025-01-15T10:30:00Z',
      templateUsed: 'template-60dpd-standard-001',
      dataVersion: '1.0',
      classification: 'CONFIDENTIAL',
      retentionPeriod: 2555,
    },
  })
  @IsObject()
  documentMetadata: {
    documentId: string;
    documentType: string;
    generatedFor: string;
    generatedBy: string;
    generationTimestamp: string;
    templateUsed: string;
    dataVersion: string;
    classification: string;
    retentionPeriod: number;
  };

  @ApiProperty({
    description: 'Data quality assessment',
    example: {
      completenessScore: 95,
      accuracyScore: 98,
      freshnessScore: 85,
      missingFields: [],
      outdatedFields: ['lastPaymentDate'],
    },
  })
  @IsObject()
  dataQuality: {
    completenessScore: number;
    accuracyScore: number;
    freshnessScore: number;
    missingFields: string[];
    outdatedFields: string[];
  };

  @ApiProperty({
    description: 'Compliance check results',
    example: {
      legalRequirements: true,
      dataPrivacy: true,
      mandatoryDisclosures: true,
      languageCompliance: true,
      issues: [],
    },
  })
  @IsObject()
  complianceCheck: {
    legalRequirements: boolean;
    dataPrivacy: boolean;
    mandatoryDisclosures: boolean;
    languageCompliance: boolean;
    issues: string[];
  };

  @ApiProperty({
    description: 'Delivery instructions',
    example: {
      primaryMode: 'Email',
      backupModes: ['SMS', 'Courier'],
      deliverySchedule: '2025-01-16T10:30:00Z',
      urgencyLevel: 'MEDIUM',
      trackingEnabled: true,
    },
  })
  @IsObject()
  deliveryInstructions: {
    primaryMode: string;
    backupModes: string[];
    deliverySchedule: string;
    urgencyLevel: string;
    trackingEnabled: boolean;
  };

  @ApiProperty({
    description: 'Audit trail information',
    example: {
      dataAccessed: ['loan_accounts', 'legal_notice_templates'],
      templatesUsed: ['template-60dpd-standard-001'],
      userPermissions: ['notice_generation', 'borrower_data_access'],
      securityLevel: 'CONFIDENTIAL',
    },
  })
  @IsObject()
  auditTrail: {
    dataAccessed: string[];
    templatesUsed: string[];
    userPermissions: string[];
    securityLevel: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export class TemplatePreviewRequestDto {
  @ApiProperty({
    description: 'Template ID to preview',
    example: 'template-60dpd-standard-001',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Sample data for preview',
    example: {
      borrower: { name: 'Sample Borrower' },
      loanAccount: { accountNumber: 'SAMPLE123' },
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  sampleData?: any;
}

export class CreateDynamicTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Custom 90 DPD Notice',
  })
  @IsString()
  templateName: string;

  @ApiProperty({
    description: 'Template content with Handlebars syntax',
    example:
      '<h1>{{notice.noticeType}}</h1><p>Dear {{borrower.name}},</p><p>Your account {{loanAccount.accountNumber}} is overdue...</p>',
  })
  @IsString()
  messageBody: string;

  @ApiProperty({
    description: 'Template type',
    example: 'Pre-Legal Notice',
  })
  @IsString()
  templateType: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: {
      dpdRange: '90-120',
      severity: 'HIGH',
      autoGenerated: true,
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateDynamicTemplateResponseDto {
  @ApiProperty({
    description: 'Created template ID',
    example: 'DYN-1642678800000',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Dynamic template created successfully',
  })
  @IsString()
  message: string;
}
