import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../../db/drizzle.config';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import {
  legalNotices,
  templateMaster,
  users,
  caseIdSequence,
  stateMaster,
  languageMaster,
} from '../../db/schema';
import { DataIngestionHelperService } from './data-ingestion-helper.service';
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
  constructor(private readonly dataIngestionHelper: DataIngestionHelperService) {}

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

    // Step 2: Validate template exists and is active
    const template = await this.validateTemplate(createDto.templateId);

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
        templateId: createDto.templateId,
        communicationMode: createDto.communicationMode.join(', '),
        stateId: createDto.stateId,
        languageId: createDto.languageId,
        noticeExpiryDate: createDto.noticeExpiryDate,
        legalEntityName: createDto.legalEntityName,
        issuedBy: createDto.issuedBy,
        acknowledgementRequired: createDto.acknowledgementRequired,
        noticeStatus: NoticeStatus.DRAFT,
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

    // Step 8: Return formatted response
    return this.formatNoticeResponse(
      notice[0],
      loanAccount,
      template,
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

    // Validate template
    const template = await this.validateTemplate(previewDto.templateId);

    // Generate HTML content with merged data
    const htmlContent = this.mergeTemplateData(template, {
      borrowerName: loanAccount.borrowerName,
      loanAccountNumber: previewDto.loanAccountNumber,
      dpdDays: previewDto.dpdDays,
      legalEntityName: previewDto.legalEntityName,
      currentDate: new Date().toLocaleDateString('en-IN'),
    });

    return {
      htmlContent,
      templateName: template.templateName,
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

    const template = await db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.id, updatedNotice[0].templateId))
      .limit(1);

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
      template[0],
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

    const template = await db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.id, notice.templateId))
      .limit(1);

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
      template[0],
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

        const template = await db
          .select()
          .from(templateMaster)
          .where(eq(templateMaster.id, notice.templateId))
          .limit(1);

        return this.formatNoticeResponse(
          notice,
          loanAccount,
          template[0],
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
    template: any,
    stateName?: string,
    languageName?: string,
  ): Promise<PreLegalNoticeResponseDto> {
    // Get user info for issuedBy
    const user = await db.select().from(users).where(eq(users.fullName, notice.issuedBy)).limit(1);

    return {
      id: notice.id,
      noticeCode: notice.noticeCode,
      loanAccountId: notice.loanAccountId,
      loanAccountNumber: loanAccount.accountNumber,
      borrowerName: loanAccount.borrowerName,
      dpdDays: notice.dpdDays,
      triggerType: notice.triggerType,
      templateId: notice.templateId,
      templateName: template.templateName,
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
      remarks: notice.remarks,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
      createdBy: notice.createdBy,
    };
  }
}
