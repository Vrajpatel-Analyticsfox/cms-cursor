import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { productVariantMaster, productSubtypeMaster } from '../db/schema';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant';
import { eq, and } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductVariantService {
  constructor(private eventEmitter: EventEmitter2) {}

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

    // Check for duplicate variant ID
    const existingVariantId = await db
      .select()
      .from(productVariantMaster)
      .where(eq(productVariantMaster.variantId, createProductVariantDto.variantId))
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

    const [created] = await db
      .insert(productVariantMaster)
      .values(createProductVariantDto)
      .returning();

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

    const [updated] = await db
      .update(productVariantMaster)
      .set({
        ...updateProductVariantDto,
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
