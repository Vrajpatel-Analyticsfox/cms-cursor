import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { productGroupMaster, users } from '../db/schema';
import { CreateProductGroupDto, UpdateProductGroupDto } from './dto/product-group';
import { eq, desc, sql } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductGroupService {
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
   * Generate next numeric groupId
   */
  private async generateNextGroupId(): Promise<string> {
    try {
      // Get the highest numeric groupId
      const result = await db
        .select({ groupId: productGroupMaster.groupId })
        .from(productGroupMaster)
        .where(sql`${productGroupMaster.groupId} ~ '^[0-9]+$'`)
        .orderBy(desc(sql`CAST(${productGroupMaster.groupId} AS INTEGER)`))
        .limit(1);

      if (result.length === 0) {
        return '1'; // First group
      }

      const lastId = parseInt(result[0].groupId);
      return (lastId + 1).toString();
    } catch (error) {
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  }

  async create(createProductGroupDto: CreateProductGroupDto) {
    // Generate groupId if not provided
    let groupId = createProductGroupDto.groupId;
    if (!groupId) {
      groupId = await this.generateNextGroupId();
    }

    // Check for duplicate group ID
    const existingGroupId = await db
      .select()
      .from(productGroupMaster)
      .where(eq(productGroupMaster.groupId, groupId))
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

    // Get user information
    const userInfo = await this.getUserInfo(createProductGroupDto.createdBy);

    // Create group with generated ID and resolved user
    const groupData = {
      ...createProductGroupDto,
      groupId: groupId,
      createdBy: userInfo,
    };

    const [created] = await db.insert(productGroupMaster).values(groupData).returning();

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

    // Get user information for updatedBy
    let updatedBy = updateProductGroupDto.updatedBy;
    if (updatedBy) {
      updatedBy = await this.getUserInfo(updatedBy);
    }

    const [updated] = await db
      .update(productGroupMaster)
      .set({
        ...updateProductGroupDto,
        updatedBy: updatedBy,
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
