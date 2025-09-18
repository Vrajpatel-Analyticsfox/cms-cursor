import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { templateMaster, channelMaster, languageMaster } from '../db/schema';
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
   * Generate a unique numeric template ID
   * Format: 1, 2, 3, 4, etc. (incremental numbers only)
   */
  private async generateNumericTemplateId(): Promise<string> {
    try {
      // Get the highest numeric template ID
      const result = await db
        .select({
          maxId: sql<number>`COALESCE(
            MAX(
              CASE 
                WHEN template_id ~ '^[0-9]+$' 
                THEN CAST(template_id AS INTEGER)
                ELSE 0
              END
            ), 0
          )`,
        })
        .from(templateMaster);

      const maxId = result[0]?.maxId || 0;
      const nextId = maxId + 1;

      return nextId.toString();
    } catch (error) {
      // Fallback to timestamp-based ID if database query fails
      const timestamp = Date.now().toString().slice(-6);
      return timestamp;
    }
  }

  /**
   * Check if a template ID already exists
   */
  private async isTemplateIdExists(templateId: string): Promise<boolean> {
    try {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(templateMaster)
        .where(eq(templateMaster.templateId, templateId));

      return (result[0]?.count || 0) > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a unique numeric template ID with retry logic
   */
  private async generateUniqueNumericTemplateId(maxRetries: number = 5): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      const templateId = await this.generateNumericTemplateId();
      const exists = await this.isTemplateIdExists(templateId);

      if (!exists) {
        return templateId;
      }
    }

    // Fallback to timestamp-based ID if all retries fail
    const timestamp = Date.now().toString();
    return timestamp;
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

    // Generate template ID if not provided
    let templateId = createTemplateDto.templateId;
    if (!templateId) {
      templateId = await this.generateUniqueNumericTemplateId();
    }

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

    // Create template in database with generated templateId
    const templateData = {
      ...createTemplateDto,
      templateId: templateId,
    };

    const [created] = await db.insert(templateMaster).values(templateData).returning();

    // Check if this is an SMS template and create in SMS API
    try {
      const smsResult = await this.smsTemplateService.createSmsTemplate(createTemplateDto);

      if (smsResult && typeof smsResult === 'object') {
        // For SMS templates, use the smsTemplateId as the main templateId
        const smsTemplateId = smsResult.smsTemplateId?.toString();
        if (smsTemplateId) {
          // Update the template with SMS-generated templateId
          await db
            .update(templateMaster)
            .set({
              templateId: smsTemplateId, // Use SMS template ID as main templateId
              smsTemplateId: smsResult.smsTemplateId,
              dltTemplateId: smsResult.dltTemplateId,
              isApproved: smsResult.isApproved,
              isActive: smsResult.isActive,
              updatedAt: new Date(),
            })
            .where(eq(templateMaster.id, created.id));

          // Update the created object with SMS details
          (created as any).templateId = smsTemplateId;
          (created as any).smsTemplateId = smsResult.smsTemplateId;
          (created as any).dltTemplateId = smsResult.dltTemplateId;
          (created as any).isApproved = smsResult.isApproved;
          (created as any).isActive = smsResult.isActive;
        } else {
          // Fallback: Update with SMS API details but keep original templateId
          await db
            .update(templateMaster)
            .set({
              smsTemplateId: smsResult.smsTemplateId,
              dltTemplateId: smsResult.dltTemplateId,
              isApproved: smsResult.isApproved,
              isActive: smsResult.isActive,
              updatedAt: new Date(),
            })
            .where(eq(templateMaster.id, created.id));

          // Update the created object with SMS details
          (created as any).smsTemplateId = smsResult.smsTemplateId;
          (created as any).dltTemplateId = smsResult.dltTemplateId;
          (created as any).isApproved = smsResult.isApproved;
          (created as any).isActive = smsResult.isActive;
        }
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

    const [updated] = await db
      .update(templateMaster)
      .set({
        ...updateTemplateDto,
        updatedAt: new Date(),
      })
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
