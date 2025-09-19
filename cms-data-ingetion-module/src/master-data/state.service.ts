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

  async create(createStateDto: CreateStateDto) {
    // Check for duplicate state code
    const existingStateCode = await db
      .select()
      .from(stateMaster)
      .where(eq(stateMaster.stateCode, createStateDto.stateCode))
      .limit(1);

    if (existingStateCode.length > 0) {
      throw new ConflictException('State code already exists');
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

    // If updating state code, check for duplicates
    if (updateStateDto.stateCode && updateStateDto.stateCode !== existingState.stateCode) {
      const duplicateStateCode = await db
        .select()
        .from(stateMaster)
        .where(eq(stateMaster.stateCode, updateStateDto.stateCode))
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
