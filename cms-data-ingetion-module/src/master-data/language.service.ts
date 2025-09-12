import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { languageMaster } from '../db/schema';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language';
import { eq, and } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LanguageService {
  constructor(private eventEmitter: EventEmitter2) {}

  async create(createLanguageDto: CreateLanguageDto) {
    // Validate script support
    const validScripts = ['Latin', 'Devanagari', 'Arabic', 'Cyrillic', 'Chinese', 'Japanese'];
    if (!validScripts.includes(createLanguageDto.scriptSupport)) {
      throw new BadRequestException(
        `Invalid script support. Must be one of: ${validScripts.join(', ')}`,
      );
    }

    // Check for duplicate language code
    const existingLanguageCode = await db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.languageCode, createLanguageDto.languageCode))
      .limit(1);

    if (existingLanguageCode.length > 0) {
      throw new ConflictException('Language code already exists');
    }

    // Check for duplicate language name
    const existingLanguageName = await db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.languageName, createLanguageDto.languageName))
      .limit(1);

    if (existingLanguageName.length > 0) {
      throw new ConflictException('Language name already exists');
    }

    const [created] = await db.insert(languageMaster).values(createLanguageDto).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'language',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(languageMaster).orderBy(languageMaster.languageName);
  }

  async findActive() {
    return db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.status, 'active'))
      .orderBy(languageMaster.languageName);
  }

  async findOne(id: string) {
    const [result] = await db.select().from(languageMaster).where(eq(languageMaster.id, id));

    if (!result) {
      throw new NotFoundException(`Language with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateLanguageDto: UpdateLanguageDto) {
    // Check if language exists
    const existingLanguage = await this.findOne(id);

    // If updating language code, check for duplicates
    if (
      updateLanguageDto.languageCode &&
      updateLanguageDto.languageCode !== existingLanguage.languageCode
    ) {
      const duplicateLanguageCode = await db
        .select()
        .from(languageMaster)
        .where(eq(languageMaster.languageCode, updateLanguageDto.languageCode))
        .limit(1);

      if (duplicateLanguageCode.length > 0) {
        throw new ConflictException('Language code already exists');
      }
    }

    // If updating language name, check for duplicates
    if (
      updateLanguageDto.languageName &&
      updateLanguageDto.languageName !== existingLanguage.languageName
    ) {
      const duplicateLanguageName = await db
        .select()
        .from(languageMaster)
        .where(eq(languageMaster.languageName, updateLanguageDto.languageName))
        .limit(1);

      if (duplicateLanguageName.length > 0) {
        throw new ConflictException('Language name already exists');
      }
    }

    // If updating script support, validate it
    if (updateLanguageDto.scriptSupport) {
      const validScripts = ['Latin', 'Devanagari', 'Arabic', 'Cyrillic', 'Chinese', 'Japanese'];
      if (!validScripts.includes(updateLanguageDto.scriptSupport)) {
        throw new BadRequestException(
          `Invalid script support. Must be one of: ${validScripts.join(', ')}`,
        );
      }
    }

    const [updated] = await db
      .update(languageMaster)
      .set({
        ...updateLanguageDto,
        updatedAt: new Date(),
      })
      .where(eq(languageMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'language',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    const existingLanguage = await this.findOne(id);

    const [deleted] = await db.delete(languageMaster).where(eq(languageMaster.id, id)).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'language',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }

  async findByScript(scriptSupport: string) {
    return db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.scriptSupport, scriptSupport))
      .orderBy(languageMaster.languageName);
  }

  async findActiveByScript(scriptSupport: string) {
    return db
      .select()
      .from(languageMaster)
      .where(
        and(eq(languageMaster.scriptSupport, scriptSupport), eq(languageMaster.status, 'active')),
      )
      .orderBy(languageMaster.languageName);
  }
}
