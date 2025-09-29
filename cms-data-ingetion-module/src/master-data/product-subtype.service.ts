import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { productSubtypeMaster, productTypeMaster, users } from '../db/schema';
import { CreateProductSubtypeDto, UpdateProductSubtypeDto } from './dto/product-subtype';
import { eq, and, desc, sql } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductSubtypeService {
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
   * Generate next numeric subtypeId
   */
  private async generateNextSubtypeId(): Promise<string> {
    try {
      // Get the highest numeric subtypeId
      const result = await db
        .select({ subtypeId: productSubtypeMaster.subtypeId })
        .from(productSubtypeMaster)
        .where(sql`${productSubtypeMaster.subtypeId} ~ '^[0-9]+$'`)
        .orderBy(desc(sql`CAST(${productSubtypeMaster.subtypeId} AS INTEGER)`))
        .limit(1);

      if (result.length === 0) {
        return '1'; // First subtype
      }

      const lastId = parseInt(result[0].subtypeId);
      return (lastId + 1).toString();
    } catch (error) {
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  }

  async create(createProductSubtypeDto: CreateProductSubtypeDto) {
    // Validate product type exists
    const existingType = await db
      .select()
      .from(productTypeMaster)
      .where(eq(productTypeMaster.id, createProductSubtypeDto.typeId))
      .limit(1);

    if (existingType.length === 0) {
      throw new BadRequestException('Product Type not found');
    }

    // Generate subtypeId if not provided
    let subtypeId = createProductSubtypeDto.subtypeId;
    if (!subtypeId) {
      subtypeId = await this.generateNextSubtypeId();
    }

    // Check for duplicate subtype ID
    const existingSubtypeId = await db
      .select()
      .from(productSubtypeMaster)
      .where(eq(productSubtypeMaster.subtypeId, subtypeId))
      .limit(1);

    if (existingSubtypeId.length > 0) {
      throw new ConflictException('Product Subtype ID already exists');
    }

    // Check for duplicate subtype name within the same type
    const existingSubtypeName = await db
      .select()
      .from(productSubtypeMaster)
      .where(
        and(
          eq(productSubtypeMaster.subtypeName, createProductSubtypeDto.subtypeName),
          eq(productSubtypeMaster.typeId, createProductSubtypeDto.typeId),
        ),
      )
      .limit(1);

    if (existingSubtypeName.length > 0) {
      throw new ConflictException('Product Subtype name already exists in this type');
    }

    // Get user information
    const userInfo = await this.getUserInfo(createProductSubtypeDto.createdBy);

    // Create subtype with generated ID and resolved user
    const subtypeData = {
      ...createProductSubtypeDto,
      subtypeId: subtypeId,
      createdBy: userInfo,
    };

    const [created] = await db.insert(productSubtypeMaster).values(subtypeData).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productSubtype',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(productSubtypeMaster).orderBy(productSubtypeMaster.subtypeName);
  }

  async findActive() {
    return db
      .select()
      .from(productSubtypeMaster)
      .where(eq(productSubtypeMaster.status, 'Active'))
      .orderBy(productSubtypeMaster.subtypeName);
  }

  async findOne(id: string) {
    const [result] = await db
      .select()
      .from(productSubtypeMaster)
      .where(eq(productSubtypeMaster.id, id));

    if (!result) {
      throw new NotFoundException(`Product Subtype with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateProductSubtypeDto: UpdateProductSubtypeDto) {
    // Check if product subtype exists
    const existingProductSubtype = await this.findOne(id);

    // If updating type, validate it exists
    if (updateProductSubtypeDto.typeId) {
      const existingType = await db
        .select()
        .from(productTypeMaster)
        .where(eq(productTypeMaster.id, updateProductSubtypeDto.typeId))
        .limit(1);

      if (existingType.length === 0) {
        throw new BadRequestException('Product Type not found');
      }
    }

    // If updating subtype ID, check for duplicates
    if (
      updateProductSubtypeDto.subtypeId &&
      updateProductSubtypeDto.subtypeId !== existingProductSubtype.subtypeId
    ) {
      const duplicateSubtypeId = await db
        .select()
        .from(productSubtypeMaster)
        .where(eq(productSubtypeMaster.subtypeId, updateProductSubtypeDto.subtypeId))
        .limit(1);

      if (duplicateSubtypeId.length > 0) {
        throw new ConflictException('Product Subtype ID already exists');
      }
    }

    // If updating subtype name, check for duplicates within the same type
    if (
      updateProductSubtypeDto.subtypeName &&
      updateProductSubtypeDto.subtypeName !== existingProductSubtype.subtypeName
    ) {
      const typeId = updateProductSubtypeDto.typeId || existingProductSubtype.typeId;

      const duplicateSubtypeName = await db
        .select()
        .from(productSubtypeMaster)
        .where(
          and(
            eq(productSubtypeMaster.subtypeName, updateProductSubtypeDto.subtypeName),
            eq(productSubtypeMaster.typeId, typeId),
            eq(productSubtypeMaster.id, id),
          ),
        )
        .limit(1);

      if (duplicateSubtypeName.length > 0 && duplicateSubtypeName[0].id !== id) {
        throw new ConflictException('Product Subtype name already exists in this type');
      }
    }

    // Get user information for updatedBy
    let updatedBy = updateProductSubtypeDto.updatedBy;
    if (updatedBy) {
      updatedBy = await this.getUserInfo(updatedBy);
    }

    const [updated] = await db
      .update(productSubtypeMaster)
      .set({
        ...updateProductSubtypeDto,
        updatedBy: updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(productSubtypeMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productSubtype',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    // Check if subtype exists before deleting
    await this.findOne(id);

    const [deleted] = await db
      .delete(productSubtypeMaster)
      .where(eq(productSubtypeMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productSubtype',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }

  async findByType(typeId: string) {
    return db
      .select()
      .from(productSubtypeMaster)
      .where(eq(productSubtypeMaster.typeId, typeId))
      .orderBy(productSubtypeMaster.subtypeName);
  }

  async findActiveByType(typeId: string) {
    return db
      .select()
      .from(productSubtypeMaster)
      .where(
        and(eq(productSubtypeMaster.typeId, typeId), eq(productSubtypeMaster.status, 'Active')),
      )
      .orderBy(productSubtypeMaster.subtypeName);
  }
}
