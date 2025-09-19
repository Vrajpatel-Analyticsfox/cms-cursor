import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { productVariantMaster, productSubtypeMaster, users } from '../db/schema';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant';
import { eq, and, desc, sql } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductVariantService {
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
   * Generate next numeric variantId
   */
  private async generateNextVariantId(): Promise<string> {
    try {
      // Get the highest numeric variantId
      const result = await db
        .select({ variantId: productVariantMaster.variantId })
        .from(productVariantMaster)
        .where(sql`${productVariantMaster.variantId} ~ '^[0-9]+$'`)
        .orderBy(desc(sql`CAST(${productVariantMaster.variantId} AS INTEGER)`))
        .limit(1);

      if (result.length === 0) {
        return '1'; // First variant
      }

      const lastId = parseInt(result[0].variantId);
      return (lastId + 1).toString();
    } catch (error) {
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  }

  async create(createProductVariantDto: CreateProductVariantDto) {
    // Validate product subtype exists
    const existingSubtype = await db
      .select()
      .from(productSubtypeMaster)
      .where(eq(productSubtypeMaster.id, createProductVariantDto.subtypeId))
      .limit(1);

    if (existingSubtype.length === 0) {
      throw new BadRequestException('Product Subtype not found');
    }

    // Generate variantId if not provided
    let variantId = createProductVariantDto.variantId;
    if (!variantId) {
      variantId = await this.generateNextVariantId();
    }

    // Check for duplicate variant ID
    const existingVariantId = await db
      .select()
      .from(productVariantMaster)
      .where(eq(productVariantMaster.variantId, variantId))
      .limit(1);

    if (existingVariantId.length > 0) {
      throw new ConflictException('Product Variant ID already exists');
    }

    // Check for duplicate variant name within the same subtype
    const existingVariantName = await db
      .select()
      .from(productVariantMaster)
      .where(
        and(
          eq(productVariantMaster.variantName, createProductVariantDto.variantName),
          eq(productVariantMaster.subtypeId, createProductVariantDto.subtypeId),
        ),
      )
      .limit(1);

    if (existingVariantName.length > 0) {
      throw new ConflictException('Product Variant name already exists in this subtype');
    }

    // Get user information
    const userInfo = await this.getUserInfo(createProductVariantDto.createdBy);

    // Create variant with generated ID and resolved user
    const variantData = {
      ...createProductVariantDto,
      variantId: variantId,
      createdBy: userInfo,
    };

    const [created] = await db.insert(productVariantMaster).values(variantData).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productVariant',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(productVariantMaster).orderBy(productVariantMaster.variantName);
  }

  async findActive() {
    return db
      .select()
      .from(productVariantMaster)
      .where(eq(productVariantMaster.status, 'Active'))
      .orderBy(productVariantMaster.variantName);
  }

  async findOne(id: string) {
    const [result] = await db
      .select()
      .from(productVariantMaster)
      .where(eq(productVariantMaster.id, id));

    if (!result) {
      throw new NotFoundException(`Product Variant with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateProductVariantDto: UpdateProductVariantDto) {
    // Check if product variant exists
    const existingProductVariant = await this.findOne(id);

    // If updating subtype, validate it exists
    if (updateProductVariantDto.subtypeId) {
      const existingSubtype = await db
        .select()
        .from(productSubtypeMaster)
        .where(eq(productSubtypeMaster.id, updateProductVariantDto.subtypeId))
        .limit(1);

      if (existingSubtype.length === 0) {
        throw new BadRequestException('Product Subtype not found');
      }
    }

    // If updating variant ID, check for duplicates
    if (
      updateProductVariantDto.variantId &&
      updateProductVariantDto.variantId !== existingProductVariant.variantId
    ) {
      const duplicateVariantId = await db
        .select()
        .from(productVariantMaster)
        .where(eq(productVariantMaster.variantId, updateProductVariantDto.variantId))
        .limit(1);

      if (duplicateVariantId.length > 0) {
        throw new ConflictException('Product Variant ID already exists');
      }
    }

    // If updating variant name, check for duplicates within the same subtype
    if (
      updateProductVariantDto.variantName &&
      updateProductVariantDto.variantName !== existingProductVariant.variantName
    ) {
      const subtypeId = updateProductVariantDto.subtypeId || existingProductVariant.subtypeId;

      const duplicateVariantName = await db
        .select()
        .from(productVariantMaster)
        .where(
          and(
            eq(productVariantMaster.variantName, updateProductVariantDto.variantName),
            eq(productVariantMaster.subtypeId, subtypeId),
            eq(productVariantMaster.id, id),
          ),
        )
        .limit(1);

      if (duplicateVariantName.length > 0 && duplicateVariantName[0].id !== id) {
        throw new ConflictException('Product Variant name already exists in this subtype');
      }
    }

    // Get user information for updatedBy
    let updatedBy = updateProductVariantDto.updatedBy;
    if (updatedBy) {
      updatedBy = await this.getUserInfo(updatedBy);
    }

    const [updated] = await db
      .update(productVariantMaster)
      .set({
        ...updateProductVariantDto,
        updatedBy: updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(productVariantMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productVariant',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    // Check if variant exists before deleting
    await this.findOne(id);

    const [deleted] = await db
      .delete(productVariantMaster)
      .where(eq(productVariantMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'productVariant',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }

  async findBySubtype(subtypeId: string) {
    return db
      .select()
      .from(productVariantMaster)
      .where(eq(productVariantMaster.subtypeId, subtypeId))
      .orderBy(productVariantMaster.variantName);
  }

  async findActiveBySubtype(subtypeId: string) {
    return db
      .select()
      .from(productVariantMaster)
      .where(
        and(
          eq(productVariantMaster.subtypeId, subtypeId),
          eq(productVariantMaster.status, 'Active'),
        ),
      )
      .orderBy(productVariantMaster.variantName);
  }
}
