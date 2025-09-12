import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { schemaConfiguration } from '../db/schema';
import {
  CreateSchemaConfigurationDto,
  UpdateSchemaConfigurationDto,
} from './dto/schema-configuration';
import { eq, and } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SchemaConfigurationService {
  constructor(private eventEmitter: EventEmitter2) {}

  async create(createSchemaConfigurationDto: CreateSchemaConfigurationDto) {
    // Check for duplicate schema name
    const existingSchemaName = await db
      .select()
      .from(schemaConfiguration)
      .where(eq(schemaConfiguration.schemaName, createSchemaConfigurationDto.schemaName))
      .limit(1);

    if (existingSchemaName.length > 0) {
      throw new ConflictException('Schema configuration name already exists');
    }

    const [created] = await db
      .insert(schemaConfiguration)
      .values(createSchemaConfigurationDto)
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'schemaConfiguration',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(schemaConfiguration).orderBy(schemaConfiguration.schemaName);
  }

  async findActive() {
    return db
      .select()
      .from(schemaConfiguration)
      .where(eq(schemaConfiguration.status, 'active'))
      .orderBy(schemaConfiguration.schemaName);
  }

  async findOne(id: string) {
    const [result] = await db
      .select()
      .from(schemaConfiguration)
      .where(eq(schemaConfiguration.id, id));

    if (!result) {
      throw new NotFoundException(`Schema Configuration with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateSchemaConfigurationDto: UpdateSchemaConfigurationDto) {
    // Check if schema configuration exists
    const existingSchemaConfiguration = await this.findOne(id);

    // If updating schema name, check for duplicates
    if (
      updateSchemaConfigurationDto.schemaName &&
      updateSchemaConfigurationDto.schemaName !== existingSchemaConfiguration.schemaName
    ) {
      const duplicateSchemaName = await db
        .select()
        .from(schemaConfiguration)
        .where(eq(schemaConfiguration.schemaName, updateSchemaConfigurationDto.schemaName))
        .limit(1);

      if (duplicateSchemaName.length > 0) {
        throw new ConflictException('Schema configuration name already exists');
      }
    }

    const [updated] = await db
      .update(schemaConfiguration)
      .set({
        ...updateSchemaConfigurationDto,
        updatedAt: new Date(),
      })
      .where(eq(schemaConfiguration.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'schemaConfiguration',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    const [deleted] = await db
      .delete(schemaConfiguration)
      .where(eq(schemaConfiguration.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'schemaConfiguration',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }

  async findBySourceType(sourceType: string) {
    return db
      .select()
      .from(schemaConfiguration)
      .where(eq(schemaConfiguration.sourceType, sourceType))
      .orderBy(schemaConfiguration.schemaName);
  }

  async findActiveBySourceType(sourceType: string) {
    return db
      .select()
      .from(schemaConfiguration)
      .where(
        and(
          eq(schemaConfiguration.sourceType, sourceType),
          eq(schemaConfiguration.status, 'active'),
        ),
      )
      .orderBy(schemaConfiguration.schemaName);
  }
}
