import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../../db/drizzle.config';
import { eq, and, gte, lte, desc, count, sql, inArray } from 'drizzle-orm';
import {
  legalNotices,
  templateMaster,
  users,
  caseIdSequence,
  stateMaster,
  languageMaster,
  channelMaster,
  fvfSchema,
  divSchema,
} from '../../db/schema';
import { DataIngestionHelperService } from './data-ingestion-helper.service';
import { EMailService } from '../../services/email.services';
import { SmsService } from '../../services/sms.services';
import {
  CreatePreLegalNoticeDto,
  UpdateNoticeStatusDto,
  PreLegalNoticeResponseDto,
  PreLegalNoticeListResponseDto,
  GenerateNoticePreviewDto,
  NoticePreviewResponseDto,
  NoticeFilterDto,
  NoticeStatus,
} from '../dto/pre-legal-notice.dto';

@Injectable()
export class PreLegalNoticeService {
  constructor(
    private readonly dataIngestionHelper: DataIngestionHelperService,
    private readonly emailService: EMailService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * UC001 - Create Pre-Legal Notice
   * Generates a unique notice ID following the format PLN-YYYYMMDD-[Sequence]
   */
  async createPreLegalNotice(
    createDto: CreatePreLegalNoticeDto,
    createdBy: string,
  ): Promise<PreLegalNoticeResponseDto> {
    // Step 1: Validate loan account exists
    const loanAccount = await this.validateLoanAccount(createDto.loanAccountNumber);

    // Step 2: Validate templates exist and are active
    console.log(
      `[PreLegalNoticeService] Received templateId:`,
      createDto.templateId,
      typeof createDto.templateId,
    );
    const templates = await this.validateTemplates(createDto.templateId);

    // Step 3: Check for duplicate notice within 7 days (UC001 validation rule)
    await this.checkDuplicateNotice(loanAccount.accountNumber, createDto.dpdDays);

    // Step 4: Generate unique notice code
    const noticeCode = await this.generateNoticeCode();

    // Step 5: Communication modes are now simple text strings (no validation needed)

    // Step 6: Create the notice record
    const notice = await db
      .insert(legalNotices)
      .values({
        noticeCode,
        loanAccountNumber: loanAccount.accountNumber,
        dpdDays: createDto.dpdDays,
        triggerType: createDto.triggerType,
        templateId: JSON.stringify(createDto.templateId),
        communicationMode: createDto.communicationMode.join(', '),
        stateId: createDto.stateId,
        languageId: createDto.languageId,
        noticeExpiryDate: createDto.noticeExpiryDate,
        legalEntityName: createDto.legalEntityName,
        issuedBy: createDto.issuedBy,
        acknowledgementRequired: createDto.acknowledgementRequired,
        noticeStatus: createDto.noticeStatus,
        remarks: createDto.remarks,
        createdBy,
      })
      .returning();

    // Step 7: Get state and language names
    const state = await db
      .select()
      .from(stateMaster)
      .where(eq(stateMaster.id, createDto.stateId))
      .limit(1);
    const language = await db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.id, createDto.languageId))
      .limit(1);

    // Step 8: Process templates and send messages
    await this.processTemplatesAndSendMessages(
      templates,
      createDto.communicationMode,
      loanAccount,
      createDto,
      notice[0],
    );

    // Step 9: Return formatted response
    return this.formatNoticeResponse(
      notice[0],
      loanAccount,
      templates,
      state[0]?.stateName,
      language[0]?.languageName,
    );
  }

  /**
   * Generate notice preview without saving
   */
  async generateNoticePreview(
    previewDto: GenerateNoticePreviewDto,
  ): Promise<NoticePreviewResponseDto> {
    // Validate loan account
    const loanAccount = await this.validateLoanAccount(previewDto.loanAccountNumber);

    // Validate templates
    const templates = await this.validateTemplates(previewDto.templateId);

    // Generate HTML content with merged data for the first template
    const primaryTemplate = templates[0];
    const htmlContent = this.mergeTemplateData(primaryTemplate, {
      borrowerName: loanAccount.borrowerName,
      loanAccountNumber: previewDto.loanAccountNumber,
      dpdDays: previewDto.dpdDays,
      legalEntityName: previewDto.legalEntityName,
      currentDate: new Date().toLocaleDateString('en-IN'),
    });

    return {
      htmlContent,
      templateName: primaryTemplate.templateName,
      characterCount: htmlContent.replace(/<[^>]*>/g, '').length, // Strip HTML tags for count
    };
  }

  /**
   * Update notice status (e.g., Draft -> Generated -> Sent)
   */
  async updateNoticeStatus(
    noticeId: string,
    updateDto: UpdateNoticeStatusDto,
    updatedBy: string,
  ): Promise<PreLegalNoticeResponseDto> {
    // Validate notice exists
    const existingNotice = await this.findNoticeById(noticeId);

    // Update notice
    const updatedNotice = await db
      .update(legalNotices)
      .set({
        noticeStatus: updateDto.noticeStatus as any,
        documentPath: updateDto.documentPath,
        remarks: updateDto.remarks || existingNotice.remarks,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(legalNotices.id, noticeId))
      .returning();

    // Get related data for response
    const borrowerData = await this.dataIngestionHelper.getBorrowerData(
      updatedNotice[0].loanAccountNumber,
    );

    const loanAccount = {
      id: borrowerData.loanAccountNumber,
      accountNumber: borrowerData.loanAccountNumber,
      borrowerName: borrowerData.borrowerName,
    };

    // Get template information
    const templateIds = JSON.parse(updatedNotice[0].templateId || '[]');

    if (!templateIds || templateIds.length === 0) {
      throw new BadRequestException('Template IDs cannot be empty');
    }

    const templates = await db
      .select()
      .from(templateMaster)
      .where(inArray(templateMaster.id, templateIds));

    // Get state and language names
    const state = await db
      .select()
      .from(stateMaster)
      .where(eq(stateMaster.id, updatedNotice[0].stateId))
      .limit(1);
    const language = await db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.id, updatedNotice[0].languageId))
      .limit(1);

    return this.formatNoticeResponse(
      updatedNotice[0],
      loanAccount,
      templates,
      state[0]?.stateName,
      language[0]?.languageName,
    );
  }

  /**
   * Get notice by ID
   */
  async getNoticeById(noticeId: string): Promise<PreLegalNoticeResponseDto> {
    const notice = await this.findNoticeById(noticeId);

    const borrowerData = await this.dataIngestionHelper.getBorrowerData(notice.loanAccountNumber);
    const loanAccount = {
      id: borrowerData.loanAccountNumber,
      accountNumber: borrowerData.loanAccountNumber,
      borrowerName: borrowerData.borrowerName,
    };

    // Get template information
    const templateIds = JSON.parse(notice.templateId || '[]');

    if (!templateIds || templateIds.length === 0) {
      throw new BadRequestException('Template IDs cannot be empty');
    }

    const templates = await db
      .select()
      .from(templateMaster)
      .where(inArray(templateMaster.id, templateIds));

    // Get state and language names
    const state = await db
      .select()
      .from(stateMaster)
      .where(eq(stateMaster.id, notice.stateId))
      .limit(1);
    const language = await db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.id, notice.languageId))
      .limit(1);

    return this.formatNoticeResponse(
      notice,
      loanAccount,
      templates,
      state[0]?.stateName,
      language[0]?.languageName,
    );
  }

  /**
   * Get notices with filtering and pagination
   */
  async getNotices(filters: NoticeFilterDto): Promise<PreLegalNoticeListResponseDto> {
    // Build WHERE conditions
    const conditions: any[] = [];

    // Apply filters
    if (filters.noticeStatus) {
      conditions.push(eq(legalNotices.noticeStatus, filters.noticeStatus as any));
    }

    if (filters.triggerType) {
      conditions.push(eq(legalNotices.triggerType, filters.triggerType));
    }

    if (filters.dateFrom) {
      conditions.push(gte(legalNotices.noticeGenerationDate, new Date(filters.dateFrom)));
    }

    if (filters.dateTo) {
      conditions.push(lte(legalNotices.noticeGenerationDate, new Date(filters.dateTo)));
    }

    // Apply loan account filter if provided
    if (filters.loanAccountNumber) {
      const accountExists = await this.dataIngestionHelper.loanAccountExists(
        filters.loanAccountNumber,
      );
      if (accountExists) {
        conditions.push(eq(legalNotices.loanAccountNumber, filters.loanAccountNumber));
      } else {
        // Return empty result if loan account doesn't exist
        return {
          notices: [],
          total: 0,
          page: filters.page || 1,
          limit: filters.limit || 10,
        };
      }
    }

    // Build WHERE condition
    const whereCondition =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    // Get total count
    const totalResult = whereCondition
      ? await db.select({ count: count() }).from(legalNotices).where(whereCondition)
      : await db.select({ count: count() }).from(legalNotices);

    const total = totalResult[0].count;

    // Get notices with pagination and sorting, including state and language names
    const offset = ((filters.page || 1) - 1) * (filters.limit || 10);
    const notices = whereCondition
      ? await db
          .select({
            // Legal notices fields
            id: legalNotices.id,
            noticeCode: legalNotices.noticeCode,
            loanAccountNumber: legalNotices.loanAccountNumber,
            dpdDays: legalNotices.dpdDays,
            triggerType: legalNotices.triggerType,
            templateId: legalNotices.templateId,
            communicationMode: legalNotices.communicationMode,
            stateId: legalNotices.stateId,
            languageId: legalNotices.languageId,
            noticeGenerationDate: legalNotices.noticeGenerationDate,
            noticeExpiryDate: legalNotices.noticeExpiryDate,
            legalEntityName: legalNotices.legalEntityName,
            issuedBy: legalNotices.issuedBy,
            acknowledgementRequired: legalNotices.acknowledgementRequired,
            noticeStatus: legalNotices.noticeStatus,
            documentPath: legalNotices.documentPath,
            dataStatus: legalNotices.dataStatus,
            jobStatus: legalNotices.jobStatus,
            remarks: legalNotices.remarks,
            createdAt: legalNotices.createdAt,
            updatedAt: legalNotices.updatedAt,
            createdBy: legalNotices.createdBy,
            // State master fields
            stateName: stateMaster.stateName,
            // Language master fields
            languageName: languageMaster.languageName,
          })
          .from(legalNotices)
          .leftJoin(stateMaster, eq(legalNotices.stateId, stateMaster.id))
          .leftJoin(languageMaster, eq(legalNotices.languageId, languageMaster.id))
          .where(whereCondition)
          .orderBy(desc(legalNotices.createdAt))
          .limit(filters.limit || 10)
          .offset(offset)
      : await db
          .select({
            // Legal notices fields
            id: legalNotices.id,
            noticeCode: legalNotices.noticeCode,
            loanAccountNumber: legalNotices.loanAccountNumber,
            dpdDays: legalNotices.dpdDays,
            triggerType: legalNotices.triggerType,
            templateId: legalNotices.templateId,
            communicationMode: legalNotices.communicationMode,
            stateId: legalNotices.stateId,
            languageId: legalNotices.languageId,
            noticeGenerationDate: legalNotices.noticeGenerationDate,
            noticeExpiryDate: legalNotices.noticeExpiryDate,
            legalEntityName: legalNotices.legalEntityName,
            issuedBy: legalNotices.issuedBy,
            acknowledgementRequired: legalNotices.acknowledgementRequired,
            noticeStatus: legalNotices.noticeStatus,
            documentPath: legalNotices.documentPath,
            dataStatus: legalNotices.dataStatus,
            jobStatus: legalNotices.jobStatus,
            remarks: legalNotices.remarks,
            createdAt: legalNotices.createdAt,
            updatedAt: legalNotices.updatedAt,
            createdBy: legalNotices.createdBy,
            // State master fields
            stateName: stateMaster.stateName,
            // Language master fields
            languageName: languageMaster.languageName,
          })
          .from(legalNotices)
          .leftJoin(stateMaster, eq(legalNotices.stateId, stateMaster.id))
          .leftJoin(languageMaster, eq(legalNotices.languageId, languageMaster.id))
          .orderBy(desc(legalNotices.createdAt))
          .limit(filters.limit || 10)
          .offset(offset);

    // Format response with related data
    const formattedNotices = await Promise.all(
      notices.map(async (notice) => {
        const borrowerData = await this.dataIngestionHelper.getBorrowerData(
          notice.loanAccountNumber,
        );
        const loanAccount = {
          id: borrowerData.loanAccountNumber,
          accountNumber: borrowerData.loanAccountNumber,
          borrowerName: borrowerData.borrowerName,
        };

        // Get template information
        const templateIds = JSON.parse(notice.templateId || '[]');

        if (!templateIds || templateIds.length === 0) {
          throw new BadRequestException('Template IDs cannot be empty');
        }

        const templates = await db
          .select()
          .from(templateMaster)
          .where(inArray(templateMaster.id, templateIds));

        return this.formatNoticeResponse(
          notice,
          loanAccount,
          templates,
          notice.stateName || undefined,
          notice.languageName || undefined,
        );
      }),
    );

    return {
      notices: formattedNotices,
      total,
      page: filters.page || 1,
      limit: filters.limit || 10,
    };
  }

  // Private helper methods

  private async validateLoanAccount(accountNumber: string) {
    const borrowerData = await this.dataIngestionHelper.getBorrowerData(accountNumber);
    return {
      id: accountNumber, // Use account number as ID for compatibility
      accountNumber: borrowerData.loanAccountNumber,
      borrowerName: borrowerData.borrowerName,
      status: 'active', // Assume active for now
    };
  }

  private async validateTemplate(templateId: string) {
    const template = await db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.id, templateId))
      .limit(1);

    if (!template.length) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    if (template[0].status !== 'Active') {
      throw new BadRequestException(`Template ${templateId} is not active`);
    }

    return template[0];
  }

  private async validateTemplates(templateIds: string | string[]) {
    // Ensure templateIds is always an array
    const templateIdArray = Array.isArray(templateIds) ? templateIds : [templateIds];

    // Check if templateIds is empty
    if (!templateIdArray || templateIdArray.length === 0) {
      throw new BadRequestException('Template IDs cannot be empty');
    }

    // Log for debugging
    console.log(`[PreLegalNoticeService] Validating templates:`, templateIdArray);

    const templates = await db
      .select()
      .from(templateMaster)
      .where(inArray(templateMaster.id, templateIdArray));

    if (templates.length !== templateIdArray.length) {
      const foundIds = templates.map((t) => t.id);
      const missingIds = templateIdArray.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Templates not found: ${missingIds.join(', ')}`);
    }

    const inactiveTemplates = templates.filter((t) => t.status !== 'Active');
    if (inactiveTemplates.length > 0) {
      const inactiveIds = inactiveTemplates.map((t) => t.id);
      throw new BadRequestException(`Templates are not active: ${inactiveIds.join(', ')}`);
    }

    return templates;
  }

  private async checkDuplicateNotice(loanAccountNumber: string, dpdDays: number) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const existingNotice = await db
      .select()
      .from(legalNotices)
      .where(
        and(
          eq(legalNotices.loanAccountNumber, loanAccountNumber),
          eq(legalNotices.dpdDays, dpdDays),
          gte(legalNotices.noticeGenerationDate, sevenDaysAgo),
        ),
      )
      .limit(1);

    if (existingNotice.length > 0) {
      throw new BadRequestException(
        `Duplicate notice generation for same DPD (${dpdDays}) and account within 7 days is restricted`,
      );
    }
  }

  private async generateNoticeCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const prefix = 'PLN';
    const categoryCode: string | undefined = undefined; // Can be extended for category-based codes

    // Get or create sequence for today
    const counterId = `${prefix}-${dateStr}${categoryCode ? `-${categoryCode}` : ''}`;

    // Use the existing sequence counter logic from case-id service
    const existingCounter = await db
      .select()
      .from(caseIdSequence)
      .where(eq(caseIdSequence.caseId, counterId))
      .limit(1);

    let sequenceNumber: number;

    if (existingCounter.length === 0) {
      // Create new counter for today
      const finalCaseId = `${prefix}-${dateStr}-0001`;
      await db.insert(caseIdSequence).values({
        caseId: counterId,
        categoryCode: 'NOTICE',
        casePrefix: prefix,
        dateStamp: dateStr,
        sequenceNumber: 1,
        finalCaseId: finalCaseId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
      });
      sequenceNumber = 1;
    } else {
      // Increment existing counter
      const updated = await db
        .update(caseIdSequence)
        .set({
          sequenceNumber: existingCounter[0].sequenceNumber + 1,
          updatedAt: new Date(),
          updatedBy: 'admin',
        })
        .where(eq(caseIdSequence.caseId, counterId))
        .returning();

      sequenceNumber = updated[0].sequenceNumber;
    }

    // Format: PLN-YYYYMMDD-CATEGORY-XXXX
    const formattedSequence = sequenceNumber.toString().padStart(4, '0');
    return `${prefix}-${dateStr}-${categoryCode ? `${categoryCode}-` : ''}${formattedSequence}`;
  }

  private async findNoticeById(noticeId: string) {
    const notice = await db
      .select()
      .from(legalNotices)
      .where(eq(legalNotices.id, noticeId))
      .limit(1);

    if (!notice.length) {
      throw new NotFoundException(`Notice ${noticeId} not found`);
    }

    return notice[0];
  }

  private mergeTemplateData(template: any, data: any): string {
    let content = template.messageBody;

    // Simple template merge - replace placeholders with actual data
    content = content.replace(/{{borrowerName}}/g, data.borrowerName);
    content = content.replace(/{{loanAccountNumber}}/g, data.loanAccountNumber);
    content = content.replace(/{{dpdDays}}/g, data.dpdDays.toString());
    content = content.replace(/{{legalEntityName}}/g, data.legalEntityName);
    content = content.replace(/{{currentDate}}/g, data.currentDate);

    return content;
  }

  private async formatNoticeResponse(
    notice: any,
    loanAccount: any,
    templates: any[],
    stateName?: string,
    languageName?: string,
  ): Promise<PreLegalNoticeResponseDto> {
    // Get user info for issuedBy
    const user = await db.select().from(users).where(eq(users.fullName, notice.issuedBy)).limit(1);

    // Parse template IDs from JSON string
    const templateIds = JSON.parse(notice.templateId || '[]');
    const templateNames = templates.map((t) => t.templateName);

    return {
      id: notice.id,
      noticeCode: notice.noticeCode,
      loanAccountId: notice.loanAccountId,
      loanAccountNumber: loanAccount.accountNumber,
      borrowerName: loanAccount.borrowerName,
      dpdDays: notice.dpdDays,
      triggerType: notice.triggerType,
      templateId: templateIds,
      templateNames: templateNames,
      communicationMode: notice.communicationMode.split(', '),
      stateId: notice.stateId,
      stateName: stateName || 'Unknown',
      languageId: notice.languageId,
      languageName: languageName || 'Unknown',
      noticeGenerationDate: notice.noticeGenerationDate,
      noticeExpiryDate: notice.noticeExpiryDate,
      legalEntityName: notice.legalEntityName,
      issuedBy: notice.issuedBy,
      issuedByName: user[0]?.fullName || 'System',
      acknowledgementRequired: notice.acknowledgementRequired,
      noticeStatus: notice.noticeStatus,
      documentPath: notice.documentPath,
      dataStatus: notice.dataStatus,
      jobStatus: notice.jobStatus,
      remarks: notice.remarks,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
      createdBy: notice.createdBy,
    };
  }

  /**
   * Process templates and send messages through appropriate channels
   */
  private async processTemplatesAndSendMessages(
    templates: any[],
    communicationModes: string[],
    loanAccount: any,
    createDto: CreatePreLegalNoticeDto,
    notice: any,
  ): Promise<void> {
    console.log(
      `[PreLegalNoticeService] Processing ${templates.length} templates for notice ${notice.noticeCode}`,
    );

    for (const template of templates) {
      try {
        // Get channel information for this template
        const channel = await db
          .select()
          .from(channelMaster)
          .where(eq(channelMaster.id, template.channelId))
          .limit(1);

        if (!channel.length) {
          console.warn(`[PreLegalNoticeService] Channel not found for template ${template.id}`);
          continue;
        }

        const channelName = channel[0].channelName;
        console.log(
          `[PreLegalNoticeService] Template ${template.templateName} uses channel: ${channelName}`,
        );

        // Check if this channel matches any communication mode
        const matchingMode = this.findMatchingCommunicationMode(channelName, communicationModes);

        if (!matchingMode) {
          console.log(
            `[PreLegalNoticeService] Channel ${channelName} not in communication modes: ${communicationModes.join(', ')}`,
          );
          continue;
        }

        console.log(
          `[PreLegalNoticeService] Channel ${channelName} matches communication mode: ${matchingMode}`,
        );

        // Render borrower details into template content
        const renderedContent = await this.renderBorrowerDetails(template, loanAccount, createDto);

        // Send message through appropriate channel
        await this.sendMessageThroughChannel(
          channelName,
          renderedContent,
          loanAccount,
          notice,
          template,
        );

        console.log(
          `[PreLegalNoticeService] Message sent via ${channelName} for template ${template.templateName}`,
        );
      } catch (error) {
        console.error(`[PreLegalNoticeService] Error processing template ${template.id}:`, error);
        // Continue with other templates even if one fails
      }
    }
  }

  /**
   * Find matching communication mode for channel name (case-insensitive)
   */
  private findMatchingCommunicationMode(
    channelName: string,
    communicationModes: string[],
  ): string | null {
    const normalizedChannelName = channelName.toLowerCase();

    for (const mode of communicationModes) {
      const normalizedMode = mode.toLowerCase();

      // Handle SMS variations
      if (
        normalizedChannelName === 'sms' &&
        (normalizedMode === 'sms' || normalizedMode === 'sm')
      ) {
        return mode;
      }

      // Handle other exact matches
      if (normalizedChannelName === normalizedMode) {
        return mode;
      }
    }

    return null;
  }

  /**
   * Render borrower details into template content using field validation format
   */
  private async renderBorrowerDetails(
    template: any,
    loanAccount: any,
    createDto: CreatePreLegalNoticeDto,
  ): Promise<string> {
    let content = template.messageBody;

    try {
      // Step 1: Extract placeholders from template
      const placeholders = this.extractPlaceholdersFromTemplate(content);
      console.log(`[PreLegalNoticeService] Extracted placeholders: ${placeholders.join(', ')}`);

      if (placeholders.length === 0) {
        console.log(
          `[PreLegalNoticeService] No placeholders found in template, returning original content`,
        );
        return content;
      }

      // Step 2: Resolve field IDs from field_validation_format table
      const fieldMapping = await this.resolveFieldIds(placeholders);
      console.log(`[PreLegalNoticeService] Field mapping resolved:`, fieldMapping);

      // Step 3: Fetch borrower data from data_ingestion_validated table
      const borrowerData = await this.fetchBorrowerData(fieldMapping, createDto.loanAccountNumber);
      console.log(`[PreLegalNoticeService] Borrower data fetched:`, borrowerData);

      // Step 3.1: Optional - Fetch all borrower data for debugging (uncomment if needed)
      // const recordId = await this.getRecordIdByLoanAccount(createDto.loanAccountNumber);
      // if (recordId) {
      //   const allBorrowerData = await this.getAllBorrowerDataByRecordId(recordId);
      //   console.log(`[PreLegalNoticeService] All available borrower data:`, allBorrowerData);
      // }

      // Step 4: Use only borrower data from data_ingestion_validated table
      const allData = { ...borrowerData };

      // Step 5: Replace placeholders with actual values
      content = this.replacePlaceholders(content, allData);

      console.log(`[PreLegalNoticeService] Template rendered successfully`);
      return content;
    } catch (error) {
      console.error(`[PreLegalNoticeService] Error rendering borrower details:`, error);
      // Return original content if rendering fails
      return content;
    }
  }

  /**
   * Extract placeholders from template using regex
   */
  private extractPlaceholdersFromTemplate(content: string): string[] {
    const regex = /{{\s*([^{}<>]+?)\s*}}/g;
    const matches = Array.from(
      content.matchAll(regex),
      (m: RegExpMatchArray) => `{{${m[1].trim()}}}`,
    );
    const fieldNames = matches.map((m) => m.replace(/[{}]/g, '').trim());

    return [...new Set(fieldNames)]; // Remove duplicates
  }

  /**
   * Resolve field IDs from field_validation_format table
   */
  private async resolveFieldIds(fieldNames: string[]): Promise<Map<string, string>> {
    const fieldMapping = new Map<string, string>();

    try {
      const fieldValidations = await db
        .select()
        .from(fvfSchema)
        .where(inArray(fvfSchema.field_name, fieldNames));

      for (const field of fieldValidations) {
        if (field.field_name && field.id) {
          fieldMapping.set(field.field_name, field.id);
        }
      }

      console.log(
        `[PreLegalNoticeService] Resolved ${fieldMapping.size} field IDs from ${fieldNames.length} field names`,
      );
    } catch (error) {
      console.error(`[PreLegalNoticeService] Error resolving field IDs:`, error);
    }

    return fieldMapping;
  }

  /**
   * Fetch borrower data from data_ingestion_validated table
   */
  /**
   * Fetch borrower data using record_id and field mapping
   * This method retrieves borrower data from data_ingestion_validated table
   * using the record_id found by loan account number
   */
  private async fetchBorrowerData(
    fieldMapping: Map<string, string>,
    loanAccountNumber: string,
  ): Promise<Record<string, string>> {
    const borrowerData: Record<string, string> = {};

    try {
      console.log(
        `[PreLegalNoticeService] Fetching borrower data for loan account: ${loanAccountNumber}`,
      );

      // Step 1: Get the record_id for this loan account number
      const recordId = await this.getRecordIdByLoanAccount(loanAccountNumber);

      if (!recordId) {
        console.warn(
          `[PreLegalNoticeService] No record ID found for loan account: ${loanAccountNumber}`,
        );
        return borrowerData;
      }

      // Step 2: Get field validation IDs from the mapping
      const fieldValidationIds = Array.from(fieldMapping.values());

      if (fieldValidationIds.length === 0) {
        console.log(`[PreLegalNoticeService] No field validation IDs to fetch`);
        return borrowerData;
      }

      console.log(
        `[PreLegalNoticeService] Fetching data for record_id: ${recordId} with ${fieldValidationIds.length} field validation IDs`,
      );

      // Step 3: Fetch borrower data from data_ingestion_validated table
      const validatedData = await db
        .select({
          field_validation_id: divSchema.field_validation_id,
          value: divSchema.value,
          field_name: fvfSchema.field_name,
        })
        .from(divSchema)
        .innerJoin(fvfSchema, eq(fvfSchema.id, divSchema.field_validation_id))
        .where(
          and(
            inArray(divSchema.field_validation_id, fieldValidationIds),
            eq(divSchema.record_id, recordId),
          ),
        );

      console.log(
        `[PreLegalNoticeService] Retrieved ${validatedData.length} data records from database`,
      );

      // Step 4: Map the data back to field names
      for (const data of validatedData) {
        if (data.field_validation_id && data.value) {
          // Find the field name for this field_validation_id
          for (const [fieldName, fieldId] of fieldMapping.entries()) {
            if (fieldId === data.field_validation_id) {
              borrowerData[fieldName] = data.value;
              console.log(`[PreLegalNoticeService] Mapped ${fieldName}: ${data.value}`);
              break;
            }
          }
        }
      }

      console.log(
        `[PreLegalNoticeService] Successfully fetched ${Object.keys(borrowerData).length} borrower data fields:`,
        Object.keys(borrowerData),
      );
    } catch (error) {
      console.error(`[PreLegalNoticeService] Error fetching borrower data:`, error);
    }

    return borrowerData;
  }

  /**
   * Get record ID by loan account number
   * This method finds the record_id by looking up the loan account number in the data_ingestion_validated table
   */
  private async getRecordIdByLoanAccount(loanAccountNumber: string): Promise<string | null> {
    try {
      // Find the record_id by looking up the loan account number in the value field
      // where the field_name is 'Loan Account Number'
      const result = await db
        .select({
          record_id: divSchema.record_id,
          field_name: fvfSchema.field_name,
          value: divSchema.value,
        })
        .from(divSchema)
        .innerJoin(fvfSchema, eq(fvfSchema.id, divSchema.field_validation_id))
        .where(
          and(
            eq(divSchema.value, loanAccountNumber),
            eq(fvfSchema.field_name, 'Loan Account Number'),
          ),
        )
        .limit(1);

      if (result.length > 0) {
        console.log(
          `[PreLegalNoticeService] Found record ID: ${result[0].record_id} for loan account: ${loanAccountNumber}`,
        );
        return result[0].record_id;
      } else {
        console.warn(
          `[PreLegalNoticeService] No record found for loan account: ${loanAccountNumber}`,
        );
        return null;
      }
    } catch (error) {
      console.error(`[PreLegalNoticeService] Error getting record ID:`, error);
      return null;
    }
  }

  /**
   * Get all borrower data for a specific record_id
   * This method retrieves all available data for a borrower record
   * Useful for debugging and comprehensive data analysis
   */
  private async getAllBorrowerDataByRecordId(recordId: string): Promise<Record<string, string>> {
    const allBorrowerData: Record<string, string> = {};

    try {
      console.log(`[PreLegalNoticeService] Fetching all borrower data for record_id: ${recordId}`);

      const allData = await db
        .select({
          field_name: fvfSchema.field_name,
          value: divSchema.value,
          field_validation_id: divSchema.field_validation_id,
        })
        .from(divSchema)
        .innerJoin(fvfSchema, eq(fvfSchema.id, divSchema.field_validation_id))
        .where(eq(divSchema.record_id, recordId));

      console.log(
        `[PreLegalNoticeService] Retrieved ${allData.length} total data records for record_id: ${recordId}`,
      );

      // Map all data to field names
      for (const data of allData) {
        if (data.field_name && data.value) {
          allBorrowerData[data.field_name] = data.value;
        }
      }

      console.log(
        `[PreLegalNoticeService] Available fields for record_id ${recordId}:`,
        Object.keys(allBorrowerData),
      );
    } catch (error) {
      console.error(`[PreLegalNoticeService] Error fetching all borrower data:`, error);
    }

    return allBorrowerData;
  }

  /**
   * Replace placeholders in content with actual values
   */
  private replacePlaceholders(content: string, data: Record<string, string>): string {
    let renderedContent = content;

    for (const [fieldName, value] of Object.entries(data)) {
      const placeholder = `{{${fieldName}}}`;
      const placeholderWithSpaces = `{{ ${fieldName} }}`;

      // Replace both {{fieldName}} and {{ fieldName }} formats
      renderedContent = renderedContent.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        value || '',
      );
      renderedContent = renderedContent.replace(
        new RegExp(placeholderWithSpaces.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        value || '',
      );
    }

    return renderedContent;
  }

  /**
   * Send message through appropriate channel
   */
  private async sendMessageThroughChannel(
    channelName: string,
    content: string,
    loanAccount: any,
    notice: any,
    template: any,
  ): Promise<void> {
    const normalizedChannel = channelName.toLowerCase();

    switch (normalizedChannel) {
      case 'email':
        await this.sendEmailMessage(content, loanAccount, notice, template);
        break;

      case 'sms':
        await this.sendSmsMessage(content, loanAccount, notice, template);
        break;

      case 'whatsapp':
        // TODO: Implement WhatsApp service when available
        console.log(
          `[PreLegalNoticeService] WhatsApp channel not yet implemented for template ${template.templateName}`,
        );
        break;

      default:
        console.log(
          `[PreLegalNoticeService] Unsupported channel: ${channelName} for template ${template.templateName}`,
        );
    }
  }

  /**
   * Send email message
   */
  private async sendEmailMessage(
    content: string,
    loanAccount: any,
    notice: any,
    template: any,
  ): Promise<void> {
    try {
      // For now, we'll use a placeholder email. In production, you'd get this from borrower data
      const borrowerEmail = loanAccount.email || 'borrower@example.com';

      await this.emailService.sendAutoSchedulePDF(borrowerEmail, notice.noticeCode, [
        {
          filename: `Legal_Notice_${notice.noticeCode}.html`,
          content: content,
          contentType: 'text/html',
        },
      ]);

      console.log(
        `[PreLegalNoticeService] Email sent to ${borrowerEmail} for notice ${notice.noticeCode}`,
      );
    } catch (error) {
      console.error(`[PreLegalNoticeService] Error sending email:`, error);
      throw error;
    }
  }

  /**
   * Send SMS message
   */
  private async sendSmsMessage(
    content: string,
    loanAccount: any,
    notice: any,
    template: any,
  ): Promise<void> {
    try {
      // For now, we'll use a placeholder mobile number. In production, you'd get this from borrower data
      const borrowerMobile = loanAccount.mobile || '9999999999';

      // Strip HTML tags for SMS
      const smsContent = content
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Send SMS and get detailed response
      const smsResult = await this.smsService.sendSms(borrowerMobile, smsContent);

      // Check if SMS was sent successfully
      if (smsResult.success) {
        console.log(
          `[PreLegalNoticeService] ✅ SMS sent successfully to ${borrowerMobile} for notice ${notice.noticeCode}`,
        );
        console.log(`[PreLegalNoticeService] 📱 Message ID: ${smsResult.messageId}`);
      } else {
        console.error(
          `[PreLegalNoticeService] ❌ SMS failed to ${borrowerMobile} for notice ${notice.noticeCode}`,
        );
        console.error(`[PreLegalNoticeService] Error Code: ${smsResult.errorCode}`);
        console.error(`[PreLegalNoticeService] Error Description: ${smsResult.errorDescription}`);

        // You can choose to throw an error or just log it based on your business logic
        throw new Error(`SMS sending failed: ${smsResult.errorDescription}`);
      }
    } catch (error) {
      console.error(`[PreLegalNoticeService] Error sending SMS:`, error);
      throw error;
    }
  }
}
