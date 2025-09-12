import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { templateMaster, channelMaster, languageMaster } from '../db/schema';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template';
import { eq, and } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TemplateService {
  constructor(private eventEmitter: EventEmitter2) {}

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

    // Check for duplicate template ID
    const existingTemplateId = await db
      .select()
      .from(templateMaster)
      .where(eq(templateMaster.templateId, createTemplateDto.templateId))
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

    const [created] = await db.insert(templateMaster).values(createTemplateDto).returning();

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
      .where(eq(templateMaster.status, 'active'))
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
      .where(and(eq(templateMaster.channelId, channelId), eq(templateMaster.status, 'active')))
      .orderBy(templateMaster.templateName);
  }

  async findActiveByLanguage(languageId: string) {
    return db
      .select()
      .from(templateMaster)
      .where(and(eq(templateMaster.languageId, languageId), eq(templateMaster.status, 'active')))
      .orderBy(templateMaster.templateName);
  }
}
