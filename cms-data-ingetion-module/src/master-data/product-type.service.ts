import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { productTypeMaster, productGroupMaster, users } from '../db/schema';
import { CreateProductTypeDto, UpdateProductTypeDto } from './dto/product-type';
import { eq, and, desc, sql } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductTypeService {
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
   * Generate next numeric typeId
   */
  private async generateNextTypeId(): Promise<string> {
    try {
      // Get the highest numeric typeId
      const result = await db
        .select({ typeId: productTypeMaster.typeId })
        .from(productTypeMaster)
        .where(sql`${productTypeMaster.typeId} ~ '^[0-9]+$'`)
        .orderBy(desc(sql`CAST(${productTypeMaster.typeId} AS INTEGER)`))
        .limit(1);

      if (result.length === 0) {
        return '1'; // First type
      }

      const lastId = parseInt(result[0].typeId);
      return (lastId + 1).toString();
    } catch (error) {
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  }

  async create(createProductTypeDto: CreateProductTypeDto) {
    // Validate product group exists
    const existingGroup = await db
      .select()
      .from(productGroupMaster)
      .where(eq(productGroupMaster.id, createProductTypeDto.groupId))
      .limit(1);

    if (existingGroup.length === 0) {
      throw new BadRequestException('Product Group not found');
    }

    // Generate typeId if not provided
    let typeId = createProductTypeDto.typeId;
    if (!typeId) {
      typeId = await this.generateNextTypeId();
    }

    // Check for duplicate type ID
    const existingTypeId = await db
      .select()
      .from(productTypeMaster)
      .where(eq(productTypeMaster.typeId, typeId))
      .limit(1);

    if (existingTypeId.length > 0) {
      throw new ConflictException('Product Type ID already exists');
    }

    // Check for duplicate type name within the same group
    const existingTypeName = await db
      .select()
      .from(productTypeMaster)
      .where(
        and(
          eq(productTypeMaster.typeName, createProductTypeDto.typeName),
          eq(productTypeMaster.groupId, createProductTypeDto.groupId),
        ),
      )
      .limit(1);

    if (existingTypeName.length > 0) {
      throw new ConflictException('Product Type name already exists in this group');
    }

    // Get user information
    const userInfo = await this.getUserInfo(createProductTypeDto.createdBy);

    // Create type with generated ID and resolved user
    const typeData = {
      ...createProductTypeDto,
      typeId: typeId,
      createdBy: userInfo,
    };

    const [created] = await db.insert(productTypeMaster).values(typeData).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productType',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(productTypeMaster).orderBy(productTypeMaster.typeName);
  }

  async findActive() {
    return db
      .select()
      .from(productTypeMaster)
      .where(eq(productTypeMaster.status, 'Active'))
      .orderBy(productTypeMaster.typeName);
  }

  async findOne(id: string) {
    const [result] = await db.select().from(productTypeMaster).where(eq(productTypeMaster.id, id));

    if (!result) {
      throw new NotFoundException(`Product Type with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateProductTypeDto: UpdateProductTypeDto) {
    // Check if product type exists
    const existingProductType = await this.findOne(id);

    // If updating group, validate it exists
    if (updateProductTypeDto.groupId) {
      const existingGroup = await db
        .select()
        .from(productGroupMaster)
        .where(eq(productGroupMaster.id, updateProductTypeDto.groupId))
        .limit(1);

      if (existingGroup.length === 0) {
        throw new BadRequestException('Product Group not found');
      }
    }

    // If updating type ID, check for duplicates
    if (updateProductTypeDto.typeId && updateProductTypeDto.typeId !== existingProductType.typeId) {
      const duplicateTypeId = await db
        .select()
        .from(productTypeMaster)
        .where(eq(productTypeMaster.typeId, updateProductTypeDto.typeId))
        .limit(1);

      if (duplicateTypeId.length > 0) {
        throw new ConflictException('Product Type ID already exists');
      }
    }

    // If updating type name, check for duplicates within the same group
    if (
      updateProductTypeDto.typeName &&
      updateProductTypeDto.typeName !== existingProductType.typeName
    ) {
      const groupId = updateProductTypeDto.groupId || existingProductType.groupId;

      const duplicateTypeName = await db
        .select()
        .from(productTypeMaster)
        .where(
          and(
            eq(productTypeMaster.typeName, updateProductTypeDto.typeName),
            eq(productTypeMaster.groupId, groupId),
            eq(productTypeMaster.id, id),
          ),
        )
        .limit(1);

      if (duplicateTypeName.length > 0) {
        throw new ConflictException('Product Type name already exists in this group');
      }
    }

    // Get user information for updatedBy
    let updatedBy = updateProductTypeDto.updatedBy;
    if (updatedBy) {
      updatedBy = await this.getUserInfo(updatedBy);
    }

    const [updated] = await db
      .update(productTypeMaster)
      .set({
        ...updateProductTypeDto,
        updatedBy: updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(productTypeMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productType',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    const existingProductType = await this.findOne(id);

    const [deleted] = await db
      .delete(productTypeMaster)
      .where(eq(productTypeMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productType',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }

  async findByGroup(groupId: string) {
    return db
      .select()
      .from(productTypeMaster)
      .where(eq(productTypeMaster.groupId, groupId))
      .orderBy(productTypeMaster.typeName);
  }

  async findActiveByGroup(groupId: string) {
    return db
      .select()
      .from(productTypeMaster)
      .where(and(eq(productTypeMaster.groupId, groupId), eq(productTypeMaster.status, 'Active')))
      .orderBy(productTypeMaster.typeName);
  }
}
