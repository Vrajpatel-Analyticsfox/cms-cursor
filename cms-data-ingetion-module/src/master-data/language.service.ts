import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { languageMaster, users } from '../db/schema';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language';
import { eq, and, desc, sql } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LanguageService {
  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Get user information by ID or return 'system' if not found
   */
  private async getUserInfo(userId: string): Promise<string> {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(userId)) {
        return 'system'; // Assuming UUIDs are external system IDs not in our users table
      }
      const user = await db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return user.length > 0 ? user[0].fullName : 'admin';
      return userId; // Return as-is if not UUID or numeric
    } catch (error) {
      return 'system';
    }
  }

  /**
   * Generate next numeric languageId
   */
  private async generateNextLanguageId(): Promise<string> {
    try {
      // Get the highest numeric languageId
      const result = await db
        .select({ languageId: languageMaster.languageId })
        .from(languageMaster)
        .where(sql`${languageMaster.languageId} ~ '^[0-9]+$'`)
        .orderBy(desc(sql`CAST(${languageMaster.languageId} AS INTEGER)`))
        .limit(1);

      if (result.length === 0) {
        return '1'; // First language
      }

      const lastId = parseInt(result[0].languageId);
      return (lastId + 1).toString();
    } catch (error) {
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  }

  /**
   * Generate alphabetic language code from language name
   */
  private generateLanguageCode(languageName: string): string {
    // Convert to uppercase and take first 2-3 characters
    const cleanName = languageName.trim().toUpperCase();

    // Handle common language name mappings
    const languageMappings: { [key: string]: string } = {
      ENGLISH: 'EN',
      HINDI: 'HI',
      SPANISH: 'ES',
      FRENCH: 'FR',
      GERMAN: 'DE',
      ITALIAN: 'IT',
      PORTUGUESE: 'PT',
      RUSSIAN: 'RU',
      CHINESE: 'ZH',
      JAPANESE: 'JA',
      KOREAN: 'KO',
      ARABIC: 'AR',
      BENGALI: 'BN',
      TAMIL: 'TA',
      TELUGU: 'TE',
      MARATHI: 'MR',
      GUJARATI: 'GU',
      KANNADA: 'KN',
      MALAYALAM: 'ML',
      PUNJABI: 'PA',
      URDU: 'UR',
      ORIYA: 'OR',
      ASSAMESE: 'AS',
      NEPALI: 'NE',
      SANSKRIT: 'SA',
    };

    // Check if we have a direct mapping
    if (languageMappings[cleanName]) {
      return languageMappings[cleanName];
    }

    // For other languages, take first 2-3 characters
    if (cleanName.length >= 3) {
      return cleanName.substring(0, 3);
    } else {
      return cleanName.substring(0, 2);
    }
  }

  /**
   * Check if language code already exists
   */
  private async isLanguageCodeExists(languageCode: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.languageCode, languageCode))
      .limit(1);

    return existing.length > 0;
  }

  /**
   * Generate unique language code
   */
  private async generateUniqueLanguageCode(languageName: string): Promise<string> {
    let baseCode = this.generateLanguageCode(languageName);
    let languageCode = baseCode;
    let counter = 1;

    // Keep trying until we find a unique code
    while (await this.isLanguageCodeExists(languageCode)) {
      languageCode = `${baseCode}${counter}`;
      counter++;
    }

    return languageCode;
  }

  async create(createLanguageDto: CreateLanguageDto) {
    // Validate script support
    const validScripts = ['Latin', 'Devanagari', 'Arabic', 'Cyrillic', 'Chinese', 'Japanese'];
    if (!validScripts.includes(createLanguageDto.scriptSupport)) {
      throw new BadRequestException(
        `Invalid script support. Must be one of: ${validScripts.join(', ')}`,
      );
    }

    // Check for case-insensitive duplicate language name
    const existingLanguageName = await db
      .select()
      .from(languageMaster)
      .where(sql`LOWER(${languageMaster.languageName}) = LOWER(${createLanguageDto.languageName})`)
      .limit(1);

    if (existingLanguageName.length > 0) {
      throw new ConflictException('Language name already exists');
    }

    // Generate languageId if not provided
    let languageId = createLanguageDto.languageId;
    if (!languageId) {
      languageId = await this.generateNextLanguageId();
    }

    // Check for duplicate language ID
    const existingLanguageId = await db
      .select()
      .from(languageMaster)
      .where(eq(languageMaster.languageId, languageId))
      .limit(1);

    if (existingLanguageId.length > 0) {
      throw new ConflictException('Language ID already exists');
    }

    // Generate language code if not provided
    let languageCode = createLanguageDto.languageCode;
    if (!languageCode) {
      languageCode = await this.generateUniqueLanguageCode(createLanguageDto.languageName);
    } else {
      // Check for duplicate language code if provided
      const existingLanguageCode = await db
        .select()
        .from(languageMaster)
        .where(eq(languageMaster.languageCode, languageCode))
        .limit(1);

      if (existingLanguageCode.length > 0) {
        throw new ConflictException('Language code already exists');
      }
    }

    // Get user information
    const userInfo = await this.getUserInfo(createLanguageDto.createdBy);

    // Create language with generated IDs and resolved user
    const languageData = {
      ...createLanguageDto,
      languageId: languageId,
      languageCode: languageCode,
      createdBy: userInfo,
    };

    const [created] = await db.insert(languageMaster).values(languageData).returning();

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
      .where(eq(languageMaster.status, 'Active'))
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

    // If updating language name, check for case-insensitive duplicates
    if (
      updateLanguageDto.languageName &&
      updateLanguageDto.languageName !== existingLanguage.languageName
    ) {
      const duplicateLanguageName = await db
        .select()
        .from(languageMaster)
        .where(
          sql`LOWER(${languageMaster.languageName}) = LOWER(${updateLanguageDto.languageName})`,
        )
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

    // Get user information for updatedBy if provided
    let updatedBy = updateLanguageDto.updatedBy;
    if (updatedBy) {
      updatedBy = await this.getUserInfo(updatedBy);
    }

    const [updated] = await db
      .update(languageMaster)
      .set({
        ...updateLanguageDto,
        updatedBy: updatedBy,
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
        and(eq(languageMaster.scriptSupport, scriptSupport), eq(languageMaster.status, 'Active')),
      )
      .orderBy(languageMaster.languageName);
  }
}
