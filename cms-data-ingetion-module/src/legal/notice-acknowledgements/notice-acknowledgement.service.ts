import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { db } from '../../db/drizzle.config';
import { eq, and, desc, count, gte, lte, sql } from 'drizzle-orm';
import { noticeAcknowledgements, legalNotices } from '../../db/schema';
import {
  CreateNoticeAcknowledgementDto,
  CreateNoticeAcknowledgementWithDocumentDto,
  UpdateNoticeAcknowledgementDto,
  NoticeAcknowledgementResponseDto,
  NoticeAcknowledgementFilterDto,
  AcknowledgedByEnum,
  NoticeTypeEnum,
  AcknowledgementStatusEnum,
} from './dto';
import { FileUploadService } from './services/file-upload.service';

@Injectable()
export class NoticeAcknowledgementService {
  private readonly logger = new Logger(NoticeAcknowledgementService.name);

  constructor(private readonly fileUploadService: FileUploadService) {}

  /**
   * Create a new notice acknowledgement (without document)
   */
  async createAcknowledgement(
    createDto: CreateNoticeAcknowledgementDto,
  ): Promise<NoticeAcknowledgementResponseDto> {
    try {
      // Step 1: Validate notice exists and is in Sent status
      const notice = await this.validateNotice(createDto.noticeId);

      // Step 2: Check if acknowledgement already exists for this notice
      await this.checkDuplicateAcknowledgement(createDto.noticeId);

      // Step 3: Generate unique acknowledgement ID
      const acknowledgementId = await this.generateAcknowledgementId();

      // Step 4: Determine notice type based on notice data
      const noticeType = this.determineNoticeType(notice);

      // Step 5: Validate acknowledgement date is within valid range
      this.validateAcknowledgementDate(createDto.acknowledgementDate, notice.noticeGenerationDate);

      // Step 6: Create acknowledgement record
      const acknowledgement = await db
        .insert(noticeAcknowledgements)
        .values({
          acknowledgementId,
          noticeId: createDto.noticeId,
          loanAccountNumber: notice.loanAccountNumber,
          borrowerName: createDto.borrowerName,
          noticeType,
          acknowledgedBy: createDto.acknowledgedBy,
          relationshipToBorrower: createDto.relationshipToBorrower || null,
          acknowledgementDate: new Date(createDto.acknowledgementDate),
          acknowledgementMode: createDto.acknowledgementMode,
          proofOfAcknowledgement: createDto.proofOfAcknowledgement || null,
          remarks: createDto.remarks || null,
          capturedBy: createDto.capturedBy,
          geoLocation: createDto.geoLocation || null,
          acknowledgementStatus: this.determineAcknowledgementStatus(createDto.acknowledgedBy) as
            | 'Acknowledged'
            | 'Refused'
            | 'Pending Verification',
          createdBy: createDto.createdBy,
        })
        .returning();

      // Step 7: Update notice status if acknowledgement is successful
      await this.updateNoticeStatus(createDto.noticeId, acknowledgement[0].acknowledgementStatus);

      this.logger.log(
        `Acknowledgement created: ${acknowledgementId} for notice ${createDto.noticeId}`,
      );

      // Get notice code using join
      const [acknowledgementWithNotice] = await db
        .select({
          // Acknowledgement fields
          id: noticeAcknowledgements.id,
          acknowledgementId: noticeAcknowledgements.acknowledgementId,
          noticeId: noticeAcknowledgements.noticeId,
          loanAccountNumber: noticeAcknowledgements.loanAccountNumber,
          borrowerName: noticeAcknowledgements.borrowerName,
          noticeType: noticeAcknowledgements.noticeType,
          acknowledgedBy: noticeAcknowledgements.acknowledgedBy,
          relationshipToBorrower: noticeAcknowledgements.relationshipToBorrower,
          acknowledgementDate: noticeAcknowledgements.acknowledgementDate,
          acknowledgementMode: noticeAcknowledgements.acknowledgementMode,
          proofOfAcknowledgement: noticeAcknowledgements.proofOfAcknowledgement,
          remarks: noticeAcknowledgements.remarks,
          capturedBy: noticeAcknowledgements.capturedBy,
          geoLocation: noticeAcknowledgements.geoLocation,
          acknowledgementStatus: noticeAcknowledgements.acknowledgementStatus,
          createdAt: noticeAcknowledgements.createdAt,
          updatedAt: noticeAcknowledgements.updatedAt,
          createdBy: noticeAcknowledgements.createdBy,
          updatedBy: noticeAcknowledgements.updatedBy,
          // Notice code from join
          noticeCode: legalNotices.noticeCode,
        })
        .from(noticeAcknowledgements)
        .leftJoin(legalNotices, eq(noticeAcknowledgements.noticeId, legalNotices.id))
        .where(eq(noticeAcknowledgements.id, acknowledgement[0].id))
        .limit(1);

      return this.mapToResponseDto(acknowledgementWithNotice);
    } catch (error) {
      this.logger.error(`Failed to create acknowledgement:`, error);
      throw error;
    }
  }

  /**
   * Create a new notice acknowledgement with document
   */
  async createAcknowledgementWithDocument(
    createDto: CreateNoticeAcknowledgementWithDocumentDto,
    file: Express.Multer.File | undefined,
  ): Promise<NoticeAcknowledgementResponseDto> {
    try {
      // Step 1: Validate notice exists and is in Sent status
      const notice = await this.validateNotice(createDto.noticeId);

      // Step 2: Check if acknowledgement already exists for this notice
      await this.checkDuplicateAcknowledgement(createDto.noticeId);

      // Step 3: Generate unique acknowledgement ID
      const acknowledgementId = await this.generateAcknowledgementId();

      // Step 4: Determine notice type based on notice data
      const noticeType = this.determineNoticeType(notice);

      // Step 5: Validate acknowledgement date is within valid range
      this.validateAcknowledgementDate(createDto.acknowledgementDate, notice.noticeGenerationDate);

      // Step 6: Upload document first
      let proofFilePath: string | null = null;
      if (file) {
        const uploadResult = await this.uploadProofDocument(file, acknowledgementId);
        if (uploadResult.success) {
          proofFilePath = uploadResult.filePath || null;
        } else {
          throw new BadRequestException(`Failed to upload document: ${uploadResult.error}`);
        }
      }

      // Step 7: Create acknowledgement record
      const acknowledgement = await db
        .insert(noticeAcknowledgements)
        .values({
          acknowledgementId,
          noticeId: createDto.noticeId,
          loanAccountNumber: notice.loanAccountNumber,
          borrowerName: createDto.borrowerName,
          noticeType,
          acknowledgedBy: createDto.acknowledgedBy,
          relationshipToBorrower: createDto.relationshipToBorrower || null,
          acknowledgementDate: new Date(createDto.acknowledgementDate),
          acknowledgementMode: createDto.acknowledgementMode,
          proofOfAcknowledgement: proofFilePath,
          remarks: createDto.remarks || null,
          capturedBy: createDto.capturedBy,
          geoLocation: createDto.geoLocation || null,
          acknowledgementStatus: this.determineAcknowledgementStatus(createDto.acknowledgedBy) as
            | 'Acknowledged'
            | 'Refused'
            | 'Pending Verification',
          createdBy: createDto.createdBy,
        })
        .returning();

      // Step 8: Update notice status if acknowledgement is successful
      await this.updateNoticeStatus(createDto.noticeId, acknowledgement[0].acknowledgementStatus);

      this.logger.log(
        `Acknowledgement created with document: ${acknowledgementId} for notice ${createDto.noticeId}`,
      );

      // Get notice code using join
      const [acknowledgementWithNotice] = await db
        .select({
          // Acknowledgement fields
          id: noticeAcknowledgements.id,
          acknowledgementId: noticeAcknowledgements.acknowledgementId,
          noticeId: noticeAcknowledgements.noticeId,
          loanAccountNumber: noticeAcknowledgements.loanAccountNumber,
          borrowerName: noticeAcknowledgements.borrowerName,
          noticeType: noticeAcknowledgements.noticeType,
          acknowledgedBy: noticeAcknowledgements.acknowledgedBy,
          relationshipToBorrower: noticeAcknowledgements.relationshipToBorrower,
          acknowledgementDate: noticeAcknowledgements.acknowledgementDate,
          acknowledgementMode: noticeAcknowledgements.acknowledgementMode,
          proofOfAcknowledgement: noticeAcknowledgements.proofOfAcknowledgement,
          remarks: noticeAcknowledgements.remarks,
          capturedBy: noticeAcknowledgements.capturedBy,
          geoLocation: noticeAcknowledgements.geoLocation,
          acknowledgementStatus: noticeAcknowledgements.acknowledgementStatus,
          createdAt: noticeAcknowledgements.createdAt,
          updatedAt: noticeAcknowledgements.updatedAt,
          createdBy: noticeAcknowledgements.createdBy,
          updatedBy: noticeAcknowledgements.updatedBy,
          // Notice code from join
          noticeCode: legalNotices.noticeCode,
        })
        .from(noticeAcknowledgements)
        .leftJoin(legalNotices, eq(noticeAcknowledgements.noticeId, legalNotices.id))
        .where(eq(noticeAcknowledgements.id, acknowledgement[0].id))
        .limit(1);

      return this.mapToResponseDto(acknowledgementWithNotice);
    } catch (error) {
      this.logger.error(`Failed to create acknowledgement with document:`, error);
      throw error;
    }
  }

  /**
   * Get acknowledgement by ID
   */
  async getAcknowledgementById(id: string): Promise<NoticeAcknowledgementResponseDto> {
    try {
      const [acknowledgement] = await db
        .select({
          // Acknowledgement fields
          id: noticeAcknowledgements.id,
          acknowledgementId: noticeAcknowledgements.acknowledgementId,
          noticeId: noticeAcknowledgements.noticeId,
          loanAccountNumber: noticeAcknowledgements.loanAccountNumber,
          borrowerName: noticeAcknowledgements.borrowerName,
          noticeType: noticeAcknowledgements.noticeType,
          acknowledgedBy: noticeAcknowledgements.acknowledgedBy,
          relationshipToBorrower: noticeAcknowledgements.relationshipToBorrower,
          acknowledgementDate: noticeAcknowledgements.acknowledgementDate,
          acknowledgementMode: noticeAcknowledgements.acknowledgementMode,
          proofOfAcknowledgement: noticeAcknowledgements.proofOfAcknowledgement,
          remarks: noticeAcknowledgements.remarks,
          capturedBy: noticeAcknowledgements.capturedBy,
          geoLocation: noticeAcknowledgements.geoLocation,
          acknowledgementStatus: noticeAcknowledgements.acknowledgementStatus,
          createdAt: noticeAcknowledgements.createdAt,
          updatedAt: noticeAcknowledgements.updatedAt,
          createdBy: noticeAcknowledgements.createdBy,
          updatedBy: noticeAcknowledgements.updatedBy,
        })
        .from(noticeAcknowledgements)
        .where(eq(noticeAcknowledgements.id, id))
        .limit(1);

      if (!acknowledgement) {
        throw new NotFoundException(`Acknowledgement with ID ${id} not found`);
      }

      // Get notice code using join
      const [acknowledgementWithNotice] = await db
        .select({
          // Acknowledgement fields
          id: noticeAcknowledgements.id,
          acknowledgementId: noticeAcknowledgements.acknowledgementId,
          noticeId: noticeAcknowledgements.noticeId,
          loanAccountNumber: noticeAcknowledgements.loanAccountNumber,
          borrowerName: noticeAcknowledgements.borrowerName,
          noticeType: noticeAcknowledgements.noticeType,
          acknowledgedBy: noticeAcknowledgements.acknowledgedBy,
          relationshipToBorrower: noticeAcknowledgements.relationshipToBorrower,
          acknowledgementDate: noticeAcknowledgements.acknowledgementDate,
          acknowledgementMode: noticeAcknowledgements.acknowledgementMode,
          proofOfAcknowledgement: noticeAcknowledgements.proofOfAcknowledgement,
          remarks: noticeAcknowledgements.remarks,
          capturedBy: noticeAcknowledgements.capturedBy,
          geoLocation: noticeAcknowledgements.geoLocation,
          acknowledgementStatus: noticeAcknowledgements.acknowledgementStatus,
          createdAt: noticeAcknowledgements.createdAt,
          updatedAt: noticeAcknowledgements.updatedAt,
          createdBy: noticeAcknowledgements.createdBy,
          updatedBy: noticeAcknowledgements.updatedBy,
          // Notice code from join
          noticeCode: legalNotices.noticeCode,
        })
        .from(noticeAcknowledgements)
        .leftJoin(legalNotices, eq(noticeAcknowledgements.noticeId, legalNotices.id))
        .where(eq(noticeAcknowledgements.id, id))
        .limit(1);

      this.logger.log(`Acknowledgement with notice: ${JSON.stringify(acknowledgementWithNotice)}`);

      if (!acknowledgementWithNotice) {
        this.logger.error(`Acknowledgement with ID ${id} not found in join query`);
        throw new NotFoundException(`Acknowledgement with ID ${id} not found`);
      }

      return this.mapToResponseDto(acknowledgementWithNotice);
    } catch (error) {
      this.logger.error(`Failed to retrieve acknowledgement by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get acknowledgements with filtering and pagination
   */
  async getAcknowledgements(
    filterDto: NoticeAcknowledgementFilterDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: NoticeAcknowledgementResponseDto[]; pagination: any }> {
    try {
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = this.buildWhereConditions(filterDto);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(noticeAcknowledgements)
        .where(whereConditions);

      const total = totalResult.count;

      // Get paginated results with notice code using join
      const acknowledgements = await db
        .select({
          // Acknowledgement fields
          id: noticeAcknowledgements.id,
          acknowledgementId: noticeAcknowledgements.acknowledgementId,
          noticeId: noticeAcknowledgements.noticeId,
          loanAccountNumber: noticeAcknowledgements.loanAccountNumber,
          borrowerName: noticeAcknowledgements.borrowerName,
          noticeType: noticeAcknowledgements.noticeType,
          acknowledgedBy: noticeAcknowledgements.acknowledgedBy,
          relationshipToBorrower: noticeAcknowledgements.relationshipToBorrower,
          acknowledgementDate: noticeAcknowledgements.acknowledgementDate,
          acknowledgementMode: noticeAcknowledgements.acknowledgementMode,
          proofOfAcknowledgement: noticeAcknowledgements.proofOfAcknowledgement,
          remarks: noticeAcknowledgements.remarks,
          capturedBy: noticeAcknowledgements.capturedBy,
          geoLocation: noticeAcknowledgements.geoLocation,
          acknowledgementStatus: noticeAcknowledgements.acknowledgementStatus,
          createdAt: noticeAcknowledgements.createdAt,
          updatedAt: noticeAcknowledgements.updatedAt,
          createdBy: noticeAcknowledgements.createdBy,
          updatedBy: noticeAcknowledgements.updatedBy,
          // Notice code from join
          noticeCode: legalNotices.noticeCode,
        })
        .from(noticeAcknowledgements)
        .leftJoin(legalNotices, eq(noticeAcknowledgements.noticeId, legalNotices.id))
        .where(whereConditions)
        .orderBy(desc(noticeAcknowledgements.createdAt))
        .limit(limit)
        .offset(offset);

      const data = acknowledgements.map((ack) => this.mapToResponseDto(ack));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve acknowledgements:`, error);
      throw error;
    }
  }

  /**
   * Internal update method for system operations (file upload/removal)
   */
  async updateAcknowledgementInternal(
    id: string,
    updateData: Partial<UpdateNoticeAcknowledgementDto>,
    updatedBy: string = 'system',
  ): Promise<NoticeAcknowledgementResponseDto> {
    try {
      // Check if acknowledgement exists
      const existingAcknowledgement = await this.getAcknowledgementById(id);
      this.logger.log(`Existing acknowledgement: ${JSON.stringify(existingAcknowledgement)}`);

      // Prepare update data with proper type conversions
      const updateFields: any = {
        ...updateData,
        updatedBy,
        updatedAt: new Date(),
      };

      // Convert date string to Date object if present
      if (updateData.acknowledgementDate) {
        updateFields.acknowledgementDate = new Date(updateData.acknowledgementDate);
      }

      // Update acknowledgement
      const [updatedAcknowledgement] = await db
        .update(noticeAcknowledgements)
        .set(updateFields)
        .where(eq(noticeAcknowledgements.id, id))
        .returning();

      this.logger.log(`Updated acknowledgement: ${JSON.stringify(updatedAcknowledgement)}`);

      // Fetch updated acknowledgement with notice details
      const acknowledgementWithNotice = await this.getAcknowledgementById(id);
      return this.mapToResponseDto(acknowledgementWithNotice);
    } catch (error) {
      this.logger.error(`Error updating acknowledgement: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update acknowledgement
   */
  async updateAcknowledgement(
    id: string,
    updateDto: UpdateNoticeAcknowledgementDto,
  ): Promise<NoticeAcknowledgementResponseDto> {
    try {
      // Check if acknowledgement exists
      const existingAcknowledgement = await this.getAcknowledgementById(id);
      this.logger.log(`Existing acknowledgement: ${JSON.stringify(existingAcknowledgement)}`);

      if (!existingAcknowledgement) {
        throw new NotFoundException(`Acknowledgement with ID ${id} not found`);
      }

      // Validate acknowledgement date if provided
      if (updateDto.acknowledgementDate) {
        const notice = await this.validateNoticeForUpdate(existingAcknowledgement.noticeId);
        this.validateAcknowledgementDate(
          updateDto.acknowledgementDate,
          notice.noticeGenerationDate,
        );
      }

      // Update acknowledgement
      const [updatedAcknowledgement] = await db
        .update(noticeAcknowledgements)
        .set({
          acknowledgedBy: updateDto.acknowledgedBy || existingAcknowledgement.acknowledgedBy,
          relationshipToBorrower:
            updateDto.relationshipToBorrower !== undefined
              ? updateDto.relationshipToBorrower
              : existingAcknowledgement.relationshipToBorrower,
          acknowledgementDate: updateDto.acknowledgementDate
            ? new Date(updateDto.acknowledgementDate)
            : existingAcknowledgement.acknowledgementDate,
          acknowledgementMode:
            updateDto.acknowledgementMode || existingAcknowledgement.acknowledgementMode,
          proofOfAcknowledgement:
            updateDto.proofOfAcknowledgement !== undefined
              ? updateDto.proofOfAcknowledgement
              : existingAcknowledgement.proofOfAcknowledgement,
          remarks:
            updateDto.remarks !== undefined ? updateDto.remarks : existingAcknowledgement.remarks,
          geoLocation:
            updateDto.geoLocation !== undefined
              ? updateDto.geoLocation
              : existingAcknowledgement.geoLocation,
          acknowledgementStatus: (updateDto.acknowledgementStatus ||
            existingAcknowledgement.acknowledgementStatus) as
            | 'Acknowledged'
            | 'Refused'
            | 'Pending Verification',
          updatedBy: updateDto.updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(noticeAcknowledgements.id, id))
        .returning();

      // Update notice status if acknowledgement status changed
      if (
        updateDto.acknowledgementStatus &&
        updateDto.acknowledgementStatus !== existingAcknowledgement.acknowledgementStatus
      ) {
        await this.updateNoticeStatus(
          existingAcknowledgement.noticeId,
          updateDto.acknowledgementStatus,
        );
      }

      this.logger.log(`Acknowledgement updated: ${id}`);

      // Get updated acknowledgement with notice code using join
      const [updatedAcknowledgementWithNotice] = await db
        .select({
          // Acknowledgement fields
          id: noticeAcknowledgements.id,
          acknowledgementId: noticeAcknowledgements.acknowledgementId,
          noticeId: noticeAcknowledgements.noticeId,
          loanAccountNumber: noticeAcknowledgements.loanAccountNumber,
          borrowerName: noticeAcknowledgements.borrowerName,
          noticeType: noticeAcknowledgements.noticeType,
          acknowledgedBy: noticeAcknowledgements.acknowledgedBy,
          relationshipToBorrower: noticeAcknowledgements.relationshipToBorrower,
          acknowledgementDate: noticeAcknowledgements.acknowledgementDate,
          acknowledgementMode: noticeAcknowledgements.acknowledgementMode,
          proofOfAcknowledgement: noticeAcknowledgements.proofOfAcknowledgement,
          remarks: noticeAcknowledgements.remarks,
          capturedBy: noticeAcknowledgements.capturedBy,
          geoLocation: noticeAcknowledgements.geoLocation,
          acknowledgementStatus: noticeAcknowledgements.acknowledgementStatus,
          createdAt: noticeAcknowledgements.createdAt,
          updatedAt: noticeAcknowledgements.updatedAt,
          createdBy: noticeAcknowledgements.createdBy,
          updatedBy: noticeAcknowledgements.updatedBy,
          // Notice code from join
          noticeCode: legalNotices.noticeCode,
        })
        .from(noticeAcknowledgements)
        .leftJoin(legalNotices, eq(noticeAcknowledgements.noticeId, legalNotices.id))
        .where(eq(noticeAcknowledgements.id, id))
        .limit(1);

      return this.mapToResponseDto(updatedAcknowledgementWithNotice);
    } catch (error) {
      this.logger.error(`Failed to update acknowledgement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete acknowledgement
   */
  async deleteAcknowledgement(id: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if acknowledgement exists
      await this.getAcknowledgementById(id);

      // Delete acknowledgement
      await db.delete(noticeAcknowledgements).where(eq(noticeAcknowledgements.id, id));

      this.logger.log(`Acknowledgement deleted: ${id}`);

      return { success: true, message: 'Acknowledgement deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete acknowledgement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get acknowledgements by notice ID
   */
  async getAcknowledgementsByNoticeId(
    noticeId: string,
  ): Promise<NoticeAcknowledgementResponseDto[]> {
    try {
      const acknowledgements = await db
        .select({
          // Acknowledgement fields
          id: noticeAcknowledgements.id,
          acknowledgementId: noticeAcknowledgements.acknowledgementId,
          noticeId: noticeAcknowledgements.noticeId,
          loanAccountNumber: noticeAcknowledgements.loanAccountNumber,
          borrowerName: noticeAcknowledgements.borrowerName,
          noticeType: noticeAcknowledgements.noticeType,
          acknowledgedBy: noticeAcknowledgements.acknowledgedBy,
          relationshipToBorrower: noticeAcknowledgements.relationshipToBorrower,
          acknowledgementDate: noticeAcknowledgements.acknowledgementDate,
          acknowledgementMode: noticeAcknowledgements.acknowledgementMode,
          proofOfAcknowledgement: noticeAcknowledgements.proofOfAcknowledgement,
          remarks: noticeAcknowledgements.remarks,
          capturedBy: noticeAcknowledgements.capturedBy,
          geoLocation: noticeAcknowledgements.geoLocation,
          acknowledgementStatus: noticeAcknowledgements.acknowledgementStatus,
          createdAt: noticeAcknowledgements.createdAt,
          updatedAt: noticeAcknowledgements.updatedAt,
          createdBy: noticeAcknowledgements.createdBy,
          updatedBy: noticeAcknowledgements.updatedBy,
          // Notice code from join
          noticeCode: legalNotices.noticeCode,
        })
        .from(noticeAcknowledgements)
        .leftJoin(legalNotices, eq(noticeAcknowledgements.noticeId, legalNotices.id))
        .where(eq(noticeAcknowledgements.noticeId, noticeId))
        .orderBy(desc(noticeAcknowledgements.createdAt));

      return acknowledgements.map((ack) => this.mapToResponseDto(ack));
    } catch (error) {
      this.logger.error(`Failed to retrieve acknowledgements for notice ${noticeId}:`, error);
      throw error;
    }
  }

  /**
   * Get acknowledgement statistics
   */
  async getAcknowledgementStatistics(filterDto?: NoticeAcknowledgementFilterDto): Promise<any> {
    try {
      const whereConditions = this.buildWhereConditions(filterDto);

      // Get statistics by status
      const statusStats = await db
        .select({
          acknowledgementStatus: noticeAcknowledgements.acknowledgementStatus,
          count: count(noticeAcknowledgements.id),
        })
        .from(noticeAcknowledgements)
        .where(whereConditions)
        .groupBy(noticeAcknowledgements.acknowledgementStatus);

      // Get statistics by mode
      const modeStats = await db
        .select({
          acknowledgementMode: noticeAcknowledgements.acknowledgementMode,
          count: count(noticeAcknowledgements.id),
        })
        .from(noticeAcknowledgements)
        .where(whereConditions)
        .groupBy(noticeAcknowledgements.acknowledgementMode);

      // Get statistics by acknowledged by
      const acknowledgedByStats = await db
        .select({
          acknowledgedBy: noticeAcknowledgements.acknowledgedBy,
          count: count(noticeAcknowledgements.id),
        })
        .from(noticeAcknowledgements)
        .where(whereConditions)
        .groupBy(noticeAcknowledgements.acknowledgedBy);

      // Get recent acknowledgements with notice code using join
      const recentAcknowledgements = await db
        .select({
          // Acknowledgement fields
          id: noticeAcknowledgements.id,
          acknowledgementId: noticeAcknowledgements.acknowledgementId,
          noticeId: noticeAcknowledgements.noticeId,
          loanAccountNumber: noticeAcknowledgements.loanAccountNumber,
          borrowerName: noticeAcknowledgements.borrowerName,
          noticeType: noticeAcknowledgements.noticeType,
          acknowledgedBy: noticeAcknowledgements.acknowledgedBy,
          relationshipToBorrower: noticeAcknowledgements.relationshipToBorrower,
          acknowledgementDate: noticeAcknowledgements.acknowledgementDate,
          acknowledgementMode: noticeAcknowledgements.acknowledgementMode,
          proofOfAcknowledgement: noticeAcknowledgements.proofOfAcknowledgement,
          remarks: noticeAcknowledgements.remarks,
          capturedBy: noticeAcknowledgements.capturedBy,
          geoLocation: noticeAcknowledgements.geoLocation,
          acknowledgementStatus: noticeAcknowledgements.acknowledgementStatus,
          createdAt: noticeAcknowledgements.createdAt,
          updatedAt: noticeAcknowledgements.updatedAt,
          createdBy: noticeAcknowledgements.createdBy,
          updatedBy: noticeAcknowledgements.updatedBy,
          // Notice code from join
          noticeCode: legalNotices.noticeCode,
        })
        .from(noticeAcknowledgements)
        .leftJoin(legalNotices, eq(noticeAcknowledgements.noticeId, legalNotices.id))
        .where(
          and(
            whereConditions,
            gte(noticeAcknowledgements.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // Last 7 days
          ),
        )
        .orderBy(desc(noticeAcknowledgements.createdAt))
        .limit(10);

      return {
        statusStats,
        modeStats,
        acknowledgedByStats,
        recentAcknowledgements: recentAcknowledgements.map((ack) => this.mapToResponseDto(ack)),
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve acknowledgement statistics:`, error);
      throw error;
    }
  }

  /**
   * Validate notice exists and is in Sent status (for creation)
   */
  private async validateNotice(noticeId: string): Promise<any> {
    const [notice] = await db
      .select()
      .from(legalNotices)
      .where(eq(legalNotices.id, noticeId))
      .limit(1);

    if (!notice) {
      throw new NotFoundException(`Notice with ID ${noticeId} not found`);
    }

    if (notice.noticeStatus !== 'Sent') {
      throw new BadRequestException(
        `Notice must be in 'Sent' status to create acknowledgement. Current status: ${notice.noticeStatus}`,
      );
    }

    return notice;
  }

  /**
   * Validate notice exists (for updates - no status check)
   */
  private async validateNoticeForUpdate(noticeId: string): Promise<any> {
    this.logger.log(`Validating notice for update: ${noticeId}`);
    const [notice] = await db
      .select()
      .from(legalNotices)
      .where(eq(legalNotices.id, noticeId))
      .limit(1);

    this.logger.log(`Notice found: ${JSON.stringify(notice)}`);

    if (!notice) {
      this.logger.error(`Notice with ID ${noticeId} not found`);
      throw new NotFoundException(`Notice with ID ${noticeId} not found`);
    }

    return notice;
  }

  /**
   * Check for duplicate acknowledgement
   */
  private async checkDuplicateAcknowledgement(noticeId: string): Promise<void> {
    const [existingAcknowledgement] = await db
      .select()
      .from(noticeAcknowledgements)
      .where(eq(noticeAcknowledgements.noticeId, noticeId))
      .limit(1);

    if (existingAcknowledgement) {
      throw new ConflictException(`Acknowledgement already exists for notice ${noticeId}`);
    }
  }

  /**
   * Generate unique acknowledgement ID
   */
  private async generateAcknowledgementId(): Promise<string> {
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get next sequence number for today
    const [lastSequence] = await db
      .select({ maxId: noticeAcknowledgements.acknowledgementId })
      .from(noticeAcknowledgements)
      .where(sql`${noticeAcknowledgements.acknowledgementId} LIKE ${`ACKN-${dateString}-%`}`)
      .orderBy(desc(noticeAcknowledgements.acknowledgementId))
      .limit(1);

    let sequence = 1;
    if (lastSequence?.maxId) {
      const lastSequenceNumber = parseInt(lastSequence.maxId.split('-')[2]);
      sequence = lastSequenceNumber + 1;
    }

    return `ACKN-${dateString}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Determine notice type based on notice data
   */
  private determineNoticeType(notice: any): string {
    // This logic can be enhanced based on business rules
    // For now, we'll use a simple determination based on DPD days
    if (notice.dpdDays >= 90) {
      return NoticeTypeEnum.LEGAL;
    }
    return NoticeTypeEnum.PRE_LEGAL;
  }

  /**
   * Validate acknowledgement date
   */
  private validateAcknowledgementDate(
    acknowledgementDate: string,
    noticeGenerationDate: Date,
  ): void {
    const ackDate = new Date(acknowledgementDate);
    const noticeDate = new Date(noticeGenerationDate);

    // Normalize dates to UTC midnight for accurate comparison
    const ackDateUTC = new Date(ackDate.getFullYear(), ackDate.getMonth(), ackDate.getDate());
    const noticeDateUTC = new Date(
      noticeDate.getFullYear(),
      noticeDate.getMonth(),
      noticeDate.getDate(),
    );
    const todayUTC = new Date();
    const currentDateUTC = new Date(
      todayUTC.getFullYear(),
      todayUTC.getMonth(),
      todayUTC.getDate(),
    );

    // Debug logging
    this.logger.debug(
      `Date validation - Acknowledgement: ${ackDateUTC.toISOString()}, Notice: ${noticeDateUTC.toISOString()}, Today: ${currentDateUTC.toISOString()}`,
    );

    if (ackDateUTC < noticeDateUTC) {
      throw new BadRequestException('Acknowledgement date cannot be before notice generation date');
    }

    if (ackDateUTC > currentDateUTC) {
      throw new BadRequestException('Acknowledgement date cannot be in the future');
    }
  }

  /**
   * Determine acknowledgement status based on acknowledged by
   */
  private determineAcknowledgementStatus(acknowledgedBy: string): string {
    if (acknowledgedBy === AcknowledgedByEnum.REFUSED) {
      return AcknowledgementStatusEnum.REFUSED;
    }

    // For all other cases, set to Pending Verification initially
    // This allows for manual verification of acknowledgements
    return AcknowledgementStatusEnum.PENDING_VERIFICATION;
  }

  /**
   * Update notice status based on acknowledgement
   */
  private async updateNoticeStatus(noticeId: string, acknowledgementStatus: string): Promise<void> {
    let noticeStatus: string;

    switch (acknowledgementStatus) {
      case AcknowledgementStatusEnum.ACKNOWLEDGED:
        noticeStatus = 'Acknowledged';
        break;
      case AcknowledgementStatusEnum.REFUSED:
        noticeStatus = 'Refused';
        break;
      case AcknowledgementStatusEnum.PENDING_VERIFICATION:
        noticeStatus = 'Pending Verification';
        break;
      default:
        noticeStatus = 'Sent';
    }

    await db
      .update(legalNotices)
      .set({
        noticeStatus,
        updatedAt: new Date(),
      })
      .where(eq(legalNotices.id, noticeId));

    this.logger.log(`Notice ${noticeId} status updated to ${noticeStatus}`);
  }

  /**
   * Build where conditions for filtering
   */
  private buildWhereConditions(filterDto?: NoticeAcknowledgementFilterDto): any {
    if (!filterDto) return undefined;

    const conditions: any[] = [];

    if (filterDto.noticeId) {
      conditions.push(eq(noticeAcknowledgements.noticeId, filterDto.noticeId));
    }

    if (filterDto.loanAccountNumber) {
      conditions.push(eq(noticeAcknowledgements.loanAccountNumber, filterDto.loanAccountNumber));
    }

    if (filterDto.borrowerName) {
      conditions.push(
        sql`LOWER(${noticeAcknowledgements.borrowerName}) LIKE LOWER(${`%${filterDto.borrowerName}%`})`,
      );
    }

    if (filterDto.noticeType) {
      conditions.push(eq(noticeAcknowledgements.noticeType, filterDto.noticeType));
    }

    if (filterDto.acknowledgedBy) {
      conditions.push(eq(noticeAcknowledgements.acknowledgedBy, filterDto.acknowledgedBy));
    }

    if (filterDto.acknowledgementMode) {
      conditions.push(
        eq(noticeAcknowledgements.acknowledgementMode, filterDto.acknowledgementMode),
      );
    }

    if (filterDto.acknowledgementStatus) {
      conditions.push(
        eq(
          noticeAcknowledgements.acknowledgementStatus,
          filterDto.acknowledgementStatus as 'Acknowledged' | 'Refused' | 'Pending Verification',
        ),
      );
    }

    if (filterDto.capturedBy) {
      conditions.push(
        sql`LOWER(${noticeAcknowledgements.capturedBy}) LIKE LOWER(${`%${filterDto.capturedBy}%`})`,
      );
    }

    if (filterDto.dateFrom) {
      conditions.push(
        gte(noticeAcknowledgements.acknowledgementDate, new Date(filterDto.dateFrom)),
      );
    }

    if (filterDto.dateTo) {
      conditions.push(lte(noticeAcknowledgements.acknowledgementDate, new Date(filterDto.dateTo)));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Upload proof document for acknowledgement
   */
  private async uploadProofDocument(
    file: Express.Multer.File,
    acknowledgementId: string,
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Use the file upload service to upload the document
      const uploadResult = await this.fileUploadService.uploadProofFile(file, {
        acknowledgementId,
        fileType: file.originalname.split('.').pop()?.toUpperCase() || '',
        fileName: file.originalname,
        fileSize: file.size,
      });

      return uploadResult;
    } catch (error) {
      this.logger.error(`Failed to upload proof document:`, error);
      return {
        success: false,
        error: 'Failed to upload document',
      };
    }
  }

  /**
   * Map database entity to response DTO
   */
  private mapToResponseDto(acknowledgement: any): NoticeAcknowledgementResponseDto {
    return {
      id: acknowledgement.id,
      acknowledgementId: acknowledgement.acknowledgementId,
      noticeId: acknowledgement.noticeId,
      noticeCode: acknowledgement.noticeCode || 'N/A', // Add notice code
      loanAccountNumber: acknowledgement.loanAccountNumber,
      borrowerName: acknowledgement.borrowerName,
      noticeType: acknowledgement.noticeType,
      acknowledgedBy: acknowledgement.acknowledgedBy,
      relationshipToBorrower: acknowledgement.relationshipToBorrower || undefined,
      acknowledgementDate: acknowledgement.acknowledgementDate,
      acknowledgementMode: acknowledgement.acknowledgementMode,
      proofOfAcknowledgement: acknowledgement.proofOfAcknowledgement || undefined,
      remarks: acknowledgement.remarks || undefined,
      capturedBy: acknowledgement.capturedBy,
      geoLocation: acknowledgement.geoLocation || undefined,
      acknowledgementStatus: acknowledgement.acknowledgementStatus,
      createdAt: acknowledgement.createdAt || new Date(),
      updatedAt: acknowledgement.updatedAt || new Date(),
      createdBy: acknowledgement.createdBy,
      updatedBy: acknowledgement.updatedBy || undefined,
    };
  }
}
