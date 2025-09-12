import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { stateMaster } from '../db/schema';
import { CreateStateDto, UpdateStateDto } from './dto/state';
import { eq } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StateService {
  constructor(private eventEmitter: EventEmitter2) {}

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

    // Check for duplicate state ID
    const existingStateId = await db
      .select()
      .from(stateMaster)
      .where(eq(stateMaster.stateId, createStateDto.stateId))
      .limit(1);

    if (existingStateId.length > 0) {
      throw new ConflictException('State ID already exists');
    }

    const [created] = await db.insert(stateMaster).values(createStateDto).returning();

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
      .where(eq(stateMaster.status, 'active'))
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

    const [updated] = await db
      .update(stateMaster)
      .set({
        ...updateStateDto,
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
    await this.findOne(id);

    const [deleted] = await db.delete(stateMaster).where(eq(stateMaster.id, id)).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'state',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }
}
