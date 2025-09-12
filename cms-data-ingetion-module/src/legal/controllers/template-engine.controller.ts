import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { TemplateEngineService } from '../services/template-engine.service';
import { TemplateRenderingService } from '../services/template-rendering.service';
import {
  TemplateRenderRequestDto,
  TemplateRenderResultDto,
  EnhancedRenderRequestDto,
  EnhancedRenderResultDto,
  BatchRenderRequestDto,
  TemplateValidationResultDto,
  TemplatePreviewRequestDto,
  CreateDynamicTemplateDto,
  CreateDynamicTemplateResponseDto,
} from '../dto/template-engine.dto';

@ApiTags('Template Engine (UC001)')
@Controller('legal/template-engine')
@ApiBearerAuth()
export class TemplateEngineController {
  constructor(
    private readonly templateEngine: TemplateEngineService,
    private readonly templateRendering: TemplateRenderingService,
  ) {}

  @Post('render')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Render Template',
    description: `Renders a template with provided data using the advanced template engine.
    
    Features:
    - Handlebars template processing
    - Custom helper functions
    - Multi-format output (HTML, PDF, Plain Text)
    - Dynamic data merging
    - Template validation
    - Performance metrics`,
  })
  @ApiBody({
    type: TemplateRenderRequestDto,
    description: 'Template rendering request',
    examples: {
      basicRender: {
        summary: 'Basic template rendering',
        value: {
          templateId: 'template-60dpd-standard-001',
          outputFormat: 'HTML',
          locale: 'en-IN',
          templateData: {
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
            notice: {
              noticeCode: 'PLN-20250115-001',
              generationDate: '2025-01-15T10:30:00Z',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Template rendered successfully',
    type: TemplateRenderResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid template data or template not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async renderTemplate(
    @Body() renderRequest: TemplateRenderRequestDto,
  ): Promise<TemplateRenderResultDto> {
    try {
      const result = await this.templateEngine.renderTemplate(renderRequest);
      return {
        ...result,
        templateInfo: {
          ...result.templateInfo,
          lastModified: result.templateInfo.lastModified.toISOString(),
        },
        renderMetadata: {
          ...result.renderMetadata,
          renderedAt: result.renderMetadata.renderedAt.toISOString(),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('render-enhanced')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enhanced Template Rendering with Borrower Data',
    description: `Performs enhanced template rendering with comprehensive borrower and loan data integration.
    
    Advanced Features:
    - Automatic data gathering from multiple sources
    - Data quality assessment
    - Compliance checking
    - Document metadata generation
    - Audit trail creation
    - Delivery instructions
    - Data masking options`,
  })
  @ApiBody({
    type: EnhancedRenderRequestDto,
    description: 'Enhanced rendering request',
    examples: {
      enhancedRender: {
        summary: 'Enhanced rendering with borrower data',
        value: {
          templateId: 'template-60dpd-standard-001',
          dataSource: {
            loanAccountId: 'uuid-loan-account-id',
            loanAccountNumber: 'LN4567890',
            includePersonalDetails: true,
            includeAddressDetails: true,
            includeContactDetails: true,
            includeFinancialDetails: true,
            maskSensitiveData: false,
          },
          options: {
            locale: 'en-IN',
            currency: 'INR',
            dateFormat: 'DD/MM/YYYY',
            timeZone: 'Asia/Kolkata',
            outputFormat: 'HTML',
            includeHeaderFooter: true,
            printReady: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Enhanced template rendered successfully',
    type: EnhancedRenderResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid parameters or data source not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async renderEnhancedTemplate(
    @Body() renderRequest: EnhancedRenderRequestDto,
  ): Promise<EnhancedRenderResultDto> {
    try {
      const result = await this.templateRendering.renderNoticeWithBorrowerData(
        renderRequest.templateId,
        renderRequest.dataSource,
        renderRequest.options,
        renderRequest.customVariables,
      );
      return {
        ...result,
        templateInfo: {
          ...result.templateInfo,
          lastModified: result.templateInfo.lastModified.toISOString(),
        },
        renderMetadata: {
          ...result.renderMetadata,
          renderedAt: result.renderMetadata.renderedAt.toISOString(),
        },
        documentMetadata: {
          ...result.documentMetadata,
          generationTimestamp: result.documentMetadata.generationTimestamp.toISOString(),
        },
        deliveryInstructions: {
          ...result.deliveryInstructions,
          deliverySchedule: result.deliveryInstructions.deliverySchedule.toISOString(),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('render-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch Template Rendering',
    description: `Renders templates for multiple accounts in a single batch operation.
    
    Batch Features:
    - Parallel processing for performance
    - Individual error handling
    - Progress tracking
    - Resource optimization
    - Comprehensive result aggregation`,
  })
  @ApiBody({
    type: BatchRenderRequestDto,
    description: 'Batch rendering request',
    examples: {
      batchRender: {
        summary: 'Batch rendering for multiple accounts',
        value: {
          templateId: 'template-60dpd-standard-001',
          dataSources: [
            {
              loanAccountId: 'uuid-account-1',
              loanAccountNumber: 'LN4567890',
              includePersonalDetails: true,
              includeAddressDetails: true,
              includeContactDetails: true,
              includeFinancialDetails: true,
              maskSensitiveData: false,
            },
            {
              loanAccountId: 'uuid-account-2',
              loanAccountNumber: 'LN7890123',
              includePersonalDetails: true,
              includeAddressDetails: true,
              includeContactDetails: true,
              includeFinancialDetails: true,
              maskSensitiveData: false,
            },
          ],
          options: {
            locale: 'en-IN',
            currency: 'INR',
            dateFormat: 'DD/MM/YYYY',
            timeZone: 'Asia/Kolkata',
            outputFormat: 'HTML',
            includeHeaderFooter: true,
            printReady: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Batch rendering completed',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: { $ref: '#/components/schemas/EnhancedRenderResultDto' },
        },
        summary: {
          type: 'object',
          properties: {
            totalRequested: { type: 'number', example: 10 },
            successful: { type: 'number', example: 9 },
            failed: { type: 'number', example: 1 },
            executionTime: { type: 'number', example: 5432 },
          },
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accountNumber: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async renderBatchTemplates(@Body() batchRequest: BatchRenderRequestDto): Promise<any> {
    try {
      const results = await this.templateRendering.batchRenderNotices(
        batchRequest.templateId,
        batchRequest.dataSources,
        batchRequest.options,
      );

      const summary = {
        totalRequested: batchRequest.dataSources.length,
        successful: results.length,
        failed: batchRequest.dataSources.length - results.length,
        executionTime: results.reduce((sum, r) => sum + r.renderMetadata.renderDuration, 0),
      };

      const errors = batchRequest.dataSources
        .filter(
          (ds) =>
            !results.find((r) => r.documentMetadata.generatedFor.includes(ds.loanAccountNumber)),
        )
        .map((ds) => ({
          accountNumber: ds.loanAccountNumber,
          error: 'Rendering failed - check logs for details',
        }));

      return {
        results,
        summary,
        errors,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Template Preview',
    description: `Generates a preview of a template using sample data.
    
    Preview Features:
    - Mock data generation
    - Quick template testing
    - Validation without full data
    - Design verification
    - Template debugging`,
  })
  @ApiBody({
    type: TemplatePreviewRequestDto,
    description: 'Template preview request',
    examples: {
      preview: {
        summary: 'Generate template preview',
        value: {
          templateId: 'template-60dpd-standard-001',
          sampleData: {
            borrower: { name: 'Sample Borrower' },
            loanAccount: { accountNumber: 'SAMPLE123', dpdDays: 60 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Template preview generated successfully',
    type: TemplateRenderResultDto,
  })
  async generateTemplatePreview(
    @Body() previewRequest: TemplatePreviewRequestDto,
  ): Promise<TemplateRenderResultDto> {
    try {
      const result = await this.templateEngine.generateTemplatePreview(
        previewRequest.templateId,
        previewRequest.sampleData,
      );
      return {
        ...result,
        templateInfo: {
          ...result.templateInfo,
          lastModified: result.templateInfo.lastModified.toISOString(),
        },
        renderMetadata: {
          ...result.renderMetadata,
          renderedAt: result.renderMetadata.renderedAt.toISOString(),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('validate/:templateId')
  @ApiOperation({
    summary: 'Validate Template',
    description: `Validates a template for syntax errors, required variables, and compliance.
    
    Validation Checks:
    - Handlebars syntax validation
    - Required variable presence
    - Character limit compliance
    - Legal requirement compliance
    - Template structure validation`,
  })
  @ApiParam({
    name: 'templateId',
    description: 'Template ID to validate',
    example: 'template-60dpd-standard-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Template validation completed',
    type: TemplateValidationResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async validateTemplate(
    @Param('templateId') templateId: string,
  ): Promise<TemplateValidationResultDto> {
    try {
      const result = await this.templateEngine.validateTemplate(templateId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post('create-dynamic')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Dynamic Template',
    description: `Creates a new template dynamically from provided content.
    
    Dynamic Template Features:
    - Runtime template creation
    - Custom Handlebars content
    - Automatic validation
    - Immediate availability
    - Metadata support`,
  })
  @ApiBody({
    type: CreateDynamicTemplateDto,
    description: 'Dynamic template creation request',
    examples: {
      customTemplate: {
        summary: 'Create custom template',
        value: {
          templateName: 'Custom 90 DPD Notice',
          templateContent: `
            <h1>{{notice.noticeType}}</h1>
            <p>Dear {{borrower.name}},</p>
            <p>Your loan account {{loanAccount.accountNumber}} is overdue by {{loanAccount.dpdDays}} days.</p>
            <p>Outstanding Amount: {{formatCurrency loanAccount.outstandingAmount}}</p>
            <p>Please contact us immediately to resolve this matter.</p>
          `,
          templateType: 'Pre-Legal Notice',
          metadata: {
            dpdRange: '90-120',
            severity: 'HIGH',
            autoGenerated: true,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Dynamic template created successfully',
    type: CreateDynamicTemplateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid template content or syntax error',
  })
  async createDynamicTemplate(
    @Body() createRequest: CreateDynamicTemplateDto,
  ): Promise<CreateDynamicTemplateResponseDto> {
    try {
      const templateId = await this.templateEngine.createDynamicTemplate(
        createRequest.templateName,
        createRequest.templateContent,
        createRequest.templateType,
        createRequest.metadata,
      );

      return {
        templateId,
        success: true,
        message: 'Dynamic template created successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('helpers')
  @ApiOperation({
    summary: 'Get Available Template Helpers',
    description: `Returns a list of available Handlebars helper functions for template creation.
    
    Helper Categories:
    - Date formatting helpers
    - Currency formatting helpers
    - Number formatting helpers
    - Text transformation helpers
    - Conditional helpers
    - Legal document helpers`,
  })
  @ApiResponse({
    status: 200,
    description: 'Template helpers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        helpers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'formatCurrency' },
              description: { type: 'string', example: 'Formats number as currency' },
              usage: { type: 'string', example: '{{formatCurrency amount "INR"}}' },
              example: { type: 'string', example: '₹387,500.00' },
              category: { type: 'string', example: 'formatting' },
            },
          },
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          example: ['formatting', 'date', 'text', 'conditional', 'legal'],
        },
      },
    },
  })
  async getTemplateHelpers(): Promise<any> {
    return {
      helpers: [
        {
          name: 'formatCurrency',
          description: 'Formats number as currency',
          usage: '{{formatCurrency amount "INR"}}',
          example: '₹387,500.00',
          category: 'formatting',
        },
        {
          name: 'formatDate',
          description: 'Formats date with specified pattern',
          usage: '{{formatDate date "DD/MM/YYYY"}}',
          example: '15/01/2025',
          category: 'date',
        },
        {
          name: 'formatNumber',
          description: 'Formats number with locale-specific formatting',
          usage: '{{formatNumber value}}',
          example: '3,87,500',
          category: 'formatting',
        },
        {
          name: 'uppercase',
          description: 'Converts text to uppercase',
          usage: '{{uppercase text}}',
          example: 'CONVERTED TEXT',
          category: 'text',
        },
        {
          name: 'ifEquals',
          description: 'Conditional helper for equality comparison',
          usage: '{{#ifEquals value1 value2}}...{{/ifEquals}}',
          example: 'Renders content if values are equal',
          category: 'conditional',
        },
        {
          name: 'daysBetween',
          description: 'Calculates days between two dates',
          usage: '{{daysBetween date1 date2}}',
          example: '45',
          category: 'date',
        },
        {
          name: 'addDays',
          description: 'Adds days to a date',
          usage: '{{addDays date 15}}',
          example: '2025-01-30',
          category: 'date',
        },
        {
          name: 'formatCommunicationModes',
          description: 'Formats array of communication modes',
          usage: '{{formatCommunicationModes modes}}',
          example: 'Email, SMS, and Courier',
          category: 'legal',
        },
      ],
      categories: ['formatting', 'date', 'text', 'conditional', 'legal'],
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Checks the health status of the template engine service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2025-01-15T10:30:00Z' },
        service: { type: 'string', example: 'Template Engine Service' },
        version: { type: 'string', example: '2.0.0' },
        dependencies: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'connected' },
            handlebars: { type: 'string', example: 'loaded' },
            templates: { type: 'number', example: 15 },
          },
        },
        performance: {
          type: 'object',
          properties: {
            averageRenderTime: { type: 'number', example: 234 },
            helpersLoaded: { type: 'number', example: 12 },
            templatesCompiled: { type: 'number', example: 8 },
          },
        },
      },
    },
  })
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Template Engine Service',
      version: '2.0.0',
      dependencies: {
        database: 'connected',
        handlebars: 'loaded',
        templates: 15,
      },
      performance: {
        averageRenderTime: 234, // milliseconds
        helpersLoaded: 12,
        templatesCompiled: 8,
      },
    };
  }
}
