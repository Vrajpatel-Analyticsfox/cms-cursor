import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { stateMaster, courts, legalNotices, users } from '../db/schema';
import { CreateStateDto, UpdateStateDto } from './dto/state';
import { eq, count, sql, desc } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StateService {
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
      const numericId = parseInt(userId);
      if (!isNaN(numericId)) {
        const user = await db
          .select({ fullName: users.fullName })
          .from(users)
          .where(eq(users.id, numericId))
          .limit(1);
        return user.length > 0 ? user[0].fullName : 'system';
      }
      return userId; // Return as-is if not UUID or numeric
    } catch (error) {
      return 'system';
    }
  }

  /**
   * Generate next numeric stateId
   */
  private async generateNextStateId(): Promise<string> {
    try {
      // Get the highest numeric stateId
      const result = await db
        .select({ stateId: stateMaster.stateId })
        .from(stateMaster)
        .where(sql`${stateMaster.stateId} ~ '^[0-9]+$'`)
        .orderBy(desc(sql`CAST(${stateMaster.stateId} AS INTEGER)`))
        .limit(1);

      if (result.length === 0) {
        return '1'; // First state
      }

      const lastId = parseInt(result[0].stateId);
      return (lastId + 1).toString();
    } catch (error) {
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  }

  /**
   * Generate state code from state name
   * @param stateName - The full state name
   * @returns Generated state code (2-3 uppercase letters)
   */
  private generateStateCode(stateName: string): string {
    // Common state name to code mappings
    const stateMappings: Record<string, string> = {
      Maharashtra: 'MH',
      Karnataka: 'KA',
      'Tamil Nadu': 'TN',
      Kerala: 'KL',
      'Andhra Pradesh': 'AP',
      Telangana: 'TG',
      Gujarat: 'GJ',
      Rajasthan: 'RJ',
      'Madhya Pradesh': 'MP',
      'Uttar Pradesh': 'UP',
      'West Bengal': 'WB',
      Odisha: 'OR',
      Bihar: 'BR',
      Jharkhand: 'JH',
      Assam: 'AS',
      Punjab: 'PB',
      Haryana: 'HR',
      'Himachal Pradesh': 'HP',
      Uttarakhand: 'UK',
      Delhi: 'DL',
      Goa: 'GA',
      Chhattisgarh: 'CG',
      'Jammu and Kashmir': 'JK',
      Ladakh: 'LA',
      Manipur: 'MN',
      Meghalaya: 'ML',
      Mizoram: 'MZ',
      Nagaland: 'NL',
      Sikkim: 'SK',
      Tripura: 'TR',
      'Arunachal Pradesh': 'AR',
      'Andaman and Nicobar Islands': 'AN',
      Chandigarh: 'CH',
      'Dadra and Nagar Haveli': 'DN',
      'Daman and Diu': 'DD',
      Lakshadweep: 'LD',
      Puducherry: 'PY',
    };

    // Check if exact match exists
    const exactMatch = stateMappings[stateName];
    if (exactMatch) {
      return exactMatch;
    }

    // Check for case-insensitive match
    const normalizedStateName = stateName.toLowerCase();
    for (const [key, value] of Object.entries(stateMappings)) {
      if (key.toLowerCase() === normalizedStateName) {
        return value;
      }
    }

    // Generate code from state name
    const words = stateName.trim().split(/\s+/);

    if (words.length === 1) {
      // Single word state name
      const word = words[0];
      if (word.length >= 2) {
        return word.substring(0, 2).toUpperCase();
      } else {
        return word.toUpperCase() + 'X'; // Add X if single character
      }
    } else {
      // Multi-word state name
      const firstLetters = words.map((word) => word.charAt(0)).join('');
      if (firstLetters.length <= 3) {
        return firstLetters.toUpperCase();
      } else {
        return firstLetters.substring(0, 3).toUpperCase();
      }
    }
  }

  /**
   * Generate unique state code by checking for duplicates
   * @param stateName - The full state name
   * @param existingCode - Optional existing code to avoid
   * @returns Unique state code
   */
  private async generateUniqueStateCode(stateName: string, existingCode?: string): Promise<string> {
    let baseCode = this.generateStateCode(stateName);
    let stateCode = baseCode;
    let counter = 1;

    // Keep generating until we find a unique code
    while (true) {
      // Check if this code already exists (excluding the existing code if provided)
      const existing = await db
        .select()
        .from(stateMaster)
        .where(eq(stateMaster.stateCode, stateCode))
        .limit(1);

      if (existing.length === 0) {
        return stateCode; // Found unique code
      }

      // If we're checking against the same existing code, it's allowed
      if (existingCode && existing[0].stateCode === existingCode) {
        return stateCode;
      }

      // Generate next variation
      if (baseCode.length === 2) {
        stateCode = (baseCode + counter.toString()).substring(0, 3);
      } else {
        stateCode = baseCode + counter.toString();
      }

      counter++;

      // Safety check to avoid infinite loop
      if (counter > 999) {
        throw new Error('Unable to generate unique state code');
      }
    }
  }

  async create(createStateDto: CreateStateDto) {
    // Generate stateCode if not provided
    let stateCode = createStateDto.stateCode;
    if (!stateCode) {
      stateCode = await this.generateUniqueStateCode(createStateDto.stateName);
    } else {
      // Check for duplicate state code if provided
      const existingStateCode = await db
        .select()
        .from(stateMaster)
        .where(eq(stateMaster.stateCode, stateCode))
        .limit(1);

      if (existingStateCode.length > 0) {
        throw new ConflictException('State code already exists');
      }
    }

    // Generate stateId if not provided
    let stateId = createStateDto.stateId;
    if (!stateId) {
      stateId = await this.generateNextStateId();
    }

    // Check for duplicate state ID
    const existingStateId = await db
      .select()
      .from(stateMaster)
      .where(eq(stateMaster.stateId, stateId))
      .limit(1);

    if (existingStateId.length > 0) {
      throw new ConflictException('State ID already exists');
    }

    // Check for duplicate state name (case-insensitive)
    const existingStateName = await db
      .select()
      .from(stateMaster)
      .where(sql`LOWER(${stateMaster.stateName}) = LOWER(${createStateDto.stateName})`)
      .limit(1);

    if (existingStateName.length > 0) {
      throw new ConflictException('State name already exists');
    }

    // Get user information
    const userInfo = await this.getUserInfo(createStateDto.createdBy);

    // Create state with generated ID and resolved user
    const stateData = {
      ...createStateDto,
      stateCode: stateCode,
      stateId: stateId,
      createdBy: userInfo,
    };

    const [created] = await db.insert(stateMaster).values(stateData).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'state',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(stateMaster).orderBy(stateMaster.stateName);
  }

  async findActive() {
    return db
      .select()
      .from(stateMaster)
      .where(eq(stateMaster.status, 'Active'))
      .orderBy(stateMaster.stateName);
  }

  async findOne(id: string) {
    const [result] = await db.select().from(stateMaster).where(eq(stateMaster.id, id));

    if (!result) {
      throw new NotFoundException(`State with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateStateDto: UpdateStateDto) {
    // Check if state exists
    const existingState = await this.findOne(id);

    // Handle stateCode updates
    let stateCode = updateStateDto.stateCode;

    // If stateName is being updated and stateCode is not provided, auto-generate it
    if (updateStateDto.stateName && !stateCode) {
      const newStateName = updateStateDto.stateName;
      if (newStateName.toLowerCase() !== existingState.stateName.toLowerCase()) {
        stateCode = await this.generateUniqueStateCode(newStateName, existingState.stateCode);
      }
    }

    // If stateCode is being updated, check for duplicates
    if (stateCode && stateCode !== existingState.stateCode) {
      const duplicateStateCode = await db
        .select()
        .from(stateMaster)
        .where(eq(stateMaster.stateCode, stateCode))
        .limit(1);

      if (duplicateStateCode.length > 0 && duplicateStateCode[0].id !== id) {
        throw new ConflictException('State code already exists');
      }
    }

    // If updating state ID, check for duplicates
    if (updateStateDto.stateId && updateStateDto.stateId !== existingState.stateId) {
      const duplicateStateId = await db
        .select()
        .from(stateMaster)
        .where(eq(stateMaster.stateId, updateStateDto.stateId))
        .limit(1);

      if (duplicateStateId.length > 0 && duplicateStateId[0].id !== id) {
        throw new ConflictException('State ID already exists');
      }
    }

    // If updating state name, check for duplicates (case-insensitive)
    if (
      updateStateDto.stateName &&
      updateStateDto.stateName.toLowerCase() !== existingState.stateName.toLowerCase()
    ) {
      const duplicateStateName = await db
        .select()
        .from(stateMaster)
        .where(sql`LOWER(${stateMaster.stateName}) = LOWER(${updateStateDto.stateName})`)
        .limit(1);

      if (duplicateStateName.length > 0 && duplicateStateName[0].id !== id) {
        throw new ConflictException('State name already exists');
      }
    }

    // Get user information for updatedBy
    let updatedBy = updateStateDto.updatedBy;
    if (updatedBy) {
      updatedBy = await this.getUserInfo(updatedBy);
    }

    const [updated] = await db
      .update(stateMaster)
      .set({
        ...updateStateDto,
        stateCode: stateCode,
        updatedBy: updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(stateMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'state',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    // Check if state exists before deleting
    const state = await this.findOne(id);

    // Check for foreign key constraints before deletion
    await this.checkForeignKeyConstraints(id);

    const [deleted] = await db.delete(stateMaster).where(eq(stateMaster.id, id)).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'state',
      action: 'deleted',
      data: deleted,
    });

    return {
      message: 'State deleted successfully',
      id: deleted.id,
      stateName: deleted.stateName,
      stateCode: deleted.stateCode,
    };
  }

  /**
   * Check for foreign key constraints before deletion
   */
  private async checkForeignKeyConstraints(stateId: string): Promise<void> {
    interface ConstraintInfo {
      table: string;
      count: number;
      message: string;
    }

    const constraints: ConstraintInfo[] = [];

    // Check courts table
    const courtsCount = await db
      .select({ count: count() })
      .from(courts)
      .where(eq(courts.stateId, stateId));

    if (courtsCount[0].count > 0) {
      constraints.push({
        table: 'courts',
        count: courtsCount[0].count,
        message: `${courtsCount[0].count} court(s) are associated with this state`,
      });
    }

    // Check legal notices table
    const noticesCount = await db
      .select({ count: count() })
      .from(legalNotices)
      .where(eq(legalNotices.stateId, stateId));

    if (noticesCount[0].count > 0) {
      constraints.push({
        table: 'legal_notices',
        count: noticesCount[0].count,
        message: `${noticesCount[0].count} legal notice(s) are associated with this state`,
      });
    }

    // If there are constraints, throw a formatted error
    if (constraints.length > 0) {
      const totalReferences = constraints.reduce((sum, constraint) => sum + constraint.count, 0);
      const constraintDetails = constraints
        .map((constraint) => `- ${constraint.message}`)
        .join('\n');

      throw new BadRequestException({
        statusCode: 400,
        message: `Cannot delete state. It is referenced by ${totalReferences} record(s) in other tables.`,
        error: 'Foreign Key Constraint Violation',
        details: {
          stateId,
          totalReferences,
          constraints: constraints.map((c) => ({
            table: c.table,
            count: c.count,
          })),
          constraintDetails,
          suggestion:
            'Please delete or reassign the associated records before deleting this state.',
        },
      });
    }
  }
}
