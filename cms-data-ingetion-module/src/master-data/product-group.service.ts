import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { productGroupMaster } from '../db/schema';
import { CreateProductGroupDto, UpdateProductGroupDto } from './dto/product-group';
import { eq } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductGroupService {
  constructor(private eventEmitter: EventEmitter2) {}

  async create(createProductGroupDto: CreateProductGroupDto) {
    // Check for duplicate group ID
    const existingGroupId = await db
      .select()
      .from(productGroupMaster)
      .where(eq(productGroupMaster.groupId, createProductGroupDto.groupId))
      .limit(1);

    if (existingGroupId.length > 0) {
      throw new ConflictException('Product Group ID already exists');
    }

    // Check for duplicate group name
    const existingGroupName = await db
      .select()
      .from(productGroupMaster)
      .where(eq(productGroupMaster.groupName, createProductGroupDto.groupName))
      .limit(1);

    if (existingGroupName.length > 0) {
      throw new ConflictException('Product Group name already exists');
    }

    const [created] = await db.insert(productGroupMaster).values(createProductGroupDto).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productGroup',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(productGroupMaster).orderBy(productGroupMaster.groupName);
  }

  async findActive() {
    return db
      .select()
      .from(productGroupMaster)
      .where(eq(productGroupMaster.status, 'Active'))
      .orderBy(productGroupMaster.groupName);
  }

  async findOne(id: string) {
    const [result] = await db
      .select()
      .from(productGroupMaster)
      .where(eq(productGroupMaster.id, id));

    if (!result) {
      throw new NotFoundException(`Product Group with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateProductGroupDto: UpdateProductGroupDto) {
    // Check if product group exists
    const existingProductGroup = await this.findOne(id);

    // If updating group ID, check for duplicates
    if (
      updateProductGroupDto.groupId &&
      updateProductGroupDto.groupId !== existingProductGroup.groupId
    ) {
      const duplicateGroupId = await db
        .select()
        .from(productGroupMaster)
        .where(eq(productGroupMaster.groupId, updateProductGroupDto.groupId))
        .limit(1);

      if (duplicateGroupId.length > 0) {
        throw new ConflictException('Product Group ID already exists');
      }
    }

    // If updating group name, check for duplicates
    if (
      updateProductGroupDto.groupName &&
      updateProductGroupDto.groupName !== existingProductGroup.groupName
    ) {
      const duplicateGroupName = await db
        .select()
        .from(productGroupMaster)
        .where(eq(productGroupMaster.groupName, updateProductGroupDto.groupName))
        .limit(1);

      if (duplicateGroupName.length > 0 && duplicateGroupName[0].id !== id) {
        throw new ConflictException('Product Group name already exists');
      }
    }

    const [updated] = await db
      .update(productGroupMaster)
      .set({
        ...updateProductGroupDto,
        updatedAt: new Date(),
      })
      .where(eq(productGroupMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productGroup',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    // Check if group exists before deleting
    await this.findOne(id);

    const [deleted] = await db
      .delete(productGroupMaster)
      .where(eq(productGroupMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productGroup',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }
}
