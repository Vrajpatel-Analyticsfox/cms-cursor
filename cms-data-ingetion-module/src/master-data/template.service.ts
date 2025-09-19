import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { templateMaster, channelMaster, languageMaster, users } from '../db/schema';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template';
import { eq, and, sql } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SmsTemplateService } from './services/sms-template.service';

@Injectable()
export class TemplateService {
  constructor(
    private eventEmitter: EventEmitter2,
    private smsTemplateService: SmsTemplateService,
  ) {}

  /**
   * Get user information by ID or return 'system' if not found
   */
  private async getUserInfo(userId: string): Promise<string> {
    try {
      // Check if it's a UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(userId)) {
        // If it's a UUID, return 'system' as we don't have UUID-based users
        return 'system';
      }

      // Check if it's a numeric ID
      const numericId = parseInt(userId);
      if (!isNaN(numericId)) {
        const user = await db
          .select({ fullName: users.fullName })
          .from(users)
          .where(eq(users.id, numericId))
          .limit(1);

        return user.length > 0 ? user[0].fullName : 'system';
      }

      // If it's neither UUID nor numeric, return as-is (could be a username)
      return userId;
    } catch (error) {
      return 'system';
    }
  }

  async create(createTemplateDto: CreateTemplateDto) {
    // Validate channel exists
    const existingChannel = await db
      .select()
      .from(channelMaster)
      .where(eq(channelMaster.id, createTemplateDto.channelId))
      .limit(1);

    if (existingChannel.length === 0) {
      throw new BadRequestException('Channel not found');
    }

    // Validate language exists
    const existingLanguage = await db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.id, createTemplateDto.languageId))
      .limit(1);

    if (existingLanguage.length === 0) {
      throw new BadRequestException('Language not found');
    }

    // Use provided template ID
    const templateId = createTemplateDto.templateId;

    // Check for duplicate template ID
    const existingTemplateId = await db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.templateId, templateId))
      .limit(1);

    if (existingTemplateId.length > 0) {
      throw new ConflictException('Template ID already exists');
    }

    // Check for duplicate template name within the same channel and language
    const existingTemplateName = await db
      .select()
      .from(templateMaster)
      .where(
        and(
          eq(templateMaster.templateName, createTemplateDto.templateName),
          eq(templateMaster.channelId, createTemplateDto.channelId),
          eq(templateMaster.languageId, createTemplateDto.languageId),
        ),
      )
      .limit(1);

    if (existingTemplateName.length > 0) {
      throw new ConflictException(
        'Template name already exists for this channel and language combination',
      );
    }

    // Get user information
    const userInfo = await this.getUserInfo(createTemplateDto.createdBy);

    // Store original messageBody in database (SMS service will handle HTML stripping for SMS portal)
    const templateData = {
      ...createTemplateDto,
      templateId: templateId,
      messageBody: createTemplateDto.messageBody, // Store original HTML content
      createdBy: userInfo,
    };

    const [created] = await db.insert(templateMaster).values(templateData).returning();

    // Check if this is an SMS template and create in SMS API
    try {
      const smsResult = await this.smsTemplateService.createSmsTemplate(createTemplateDto);

      if (smsResult && typeof smsResult === 'object') {
        // Update the template with SMS API details (keeping original templateId)
        await db
          .update(templateMaster)
          .set({
            smsTemplateId: smsResult.smsTemplateId,
            dltTemplateId: smsResult.dltTemplateId,
            updatedAt: new Date(),
          })
          .where(eq(templateMaster.id, created.id));

        // Update the created object with SMS details
        (created as any).smsTemplateId = smsResult.smsTemplateId;
        (created as any).dltTemplateId = smsResult.dltTemplateId;
      }
    } catch (error) {
      // Log error but don't fail the template creation
      console.error('Failed to create SMS template:', error);
    }

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'template',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(templateMaster).orderBy(templateMaster.templateName);
  }

  async findActive() {
    return db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.status, 'Active'))
      .orderBy(templateMaster.templateName);
  }

  async findOne(id: string) {
    const [result] = await db.select().from(templateMaster).where(eq(templateMaster.id, id));

    if (!result) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto) {
    // Check if template exists
    const existingTemplate = await this.findOne(id);

    // If updating channel, validate it exists
    if (updateTemplateDto.channelId) {
      const existingChannel = await db
        .select()
        .from(channelMaster)
        .where(eq(channelMaster.id, updateTemplateDto.channelId))
        .limit(1);

      if (existingChannel.length === 0) {
        throw new BadRequestException('Channel not found');
      }
    }

    // If updating language, validate it exists
    if (updateTemplateDto.languageId) {
      const existingLanguage = await db
        .select()
        .from(languageMaster)
        .where(eq(languageMaster.id, updateTemplateDto.languageId))
        .limit(1);

      if (existingLanguage.length === 0) {
        throw new BadRequestException('Language not found');
      }
    }

    // If updating template ID, check for duplicates
    if (
      updateTemplateDto.templateId &&
      updateTemplateDto.templateId !== existingTemplate.templateId
    ) {
      const duplicateTemplateId = await db
        .select()
        .from(templateMaster)
        .where(eq(templateMaster.templateId, updateTemplateDto.templateId))
        .limit(1);

      if (duplicateTemplateId.length > 0) {
        throw new ConflictException('Template ID already exists');
      }
    }

    // If updating template name, check for duplicates within the same channel and language
    if (
      updateTemplateDto.templateName &&
      updateTemplateDto.templateName !== existingTemplate.templateName
    ) {
      const channelId = updateTemplateDto.channelId || existingTemplate.channelId;
      const languageId = updateTemplateDto.languageId || existingTemplate.languageId;

      const duplicateTemplateName = await db
        .select()
        .from(templateMaster)
        .where(
          and(
            eq(templateMaster.templateName, updateTemplateDto.templateName),
            eq(templateMaster.channelId, channelId),
            eq(templateMaster.languageId, languageId),
            eq(templateMaster.id, id),
          ),
        )
        .limit(1);

      if (duplicateTemplateName.length > 0 && duplicateTemplateName[0].id !== id) {
        throw new ConflictException(
          'Template name already exists for this channel and language combination',
        );
      }
    }

    // Get user information for updatedBy if provided
    let updatedBy = updateTemplateDto.updatedBy;
    if (updatedBy) {
      updatedBy = await this.getUserInfo(updatedBy);
    }

    // Store original messageBody in database (SMS service will handle HTML stripping for SMS portal)
    const updateData = {
      ...updateTemplateDto,
      messageBody: updateTemplateDto.messageBody, // Store original HTML content
      updatedBy: updatedBy,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(templateMaster)
      .set(updateData)
      .where(eq(templateMaster.id, id))
      .returning();

    // Check if this is an SMS template and update in SMS API
    try {
      const smsResult = await this.smsTemplateService.updateSmsTemplate(id, updateTemplateDto);

      if (smsResult && typeof smsResult === 'object') {
        // Update the template with any SMS API response details
        await db
          .update(templateMaster)
          .set({
            updatedAt: new Date(),
          })
          .where(eq(templateMaster.id, id));
      }
    } catch (error) {
      // Log error but don't fail the template update
      console.error('Failed to update SMS template:', error);
    }

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'template',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    // Check if template exists before deleting
    await this.findOne(id);

    // Check if this is an SMS template and delete from SMS API
    try {
      const smsResult = await this.smsTemplateService.deleteSmsTemplate(id);

      if (smsResult && typeof smsResult === 'object') {
        console.log('SMS template deleted successfully');
      }
    } catch (error) {
      // Log error but don't fail the template deletion
      console.error('Failed to delete SMS template:', error);
    }

    const [deleted] = await db.delete(templateMaster).where(eq(templateMaster.id, id)).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'template',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }

  async findByChannel(channelId: string) {
    return db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.channelId, channelId))
      .orderBy(templateMaster.templateName);
  }

  async findByLanguage(languageId: string) {
    return db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.languageId, languageId))
      .orderBy(templateMaster.templateName);
  }

  async findByChannelAndLanguage(channelId: string, languageId: string) {
    return db
      .select()
      .from(templateMaster)
      .where(
        and(eq(templateMaster.channelId, channelId), eq(templateMaster.languageId, languageId)),
      )
      .orderBy(templateMaster.templateName);
  }

  async findActiveByChannel(channelId: string) {
    return db
      .select()
      .from(templateMaster)
      .where(and(eq(templateMaster.channelId, channelId), eq(templateMaster.status, 'Active')))
      .orderBy(templateMaster.templateName);
  }

  async findActiveByLanguage(languageId: string) {
    return db
      .select()
      .from(templateMaster)
      .where(and(eq(templateMaster.languageId, languageId), eq(templateMaster.status, 'Active')))
      .orderBy(templateMaster.templateName);
  }

  async findByTemplateType(templateType: string) {
    return db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.templateType, templateType as any))
      .orderBy(templateMaster.templateName);
  }

  async findActiveByTemplateType(templateType: string) {
    return db
      .select()
      .from(templateMaster)
      .where(
        and(
          eq(templateMaster.templateType, templateType as any),
          eq(templateMaster.status, 'Active'),
        ),
      )
      .orderBy(templateMaster.templateName);
  }

  async findByChannelAndTemplateType(channelId: string, templateType: string) {
    return db
      .select()
      .from(templateMaster)
      .where(
        and(
          eq(templateMaster.channelId, channelId),
          eq(templateMaster.templateType, templateType as any),
        ),
      )
      .orderBy(templateMaster.templateName);
  }

  async findActiveByChannelAndTemplateType(channelId: string, templateType: string) {
    return db
      .select()
      .from(templateMaster)
      .where(
        and(
          eq(templateMaster.channelId, channelId),
          eq(templateMaster.templateType, templateType as any),
          eq(templateMaster.status, 'Active'),
        ),
      )
      .orderBy(templateMaster.templateName);
  }
}
