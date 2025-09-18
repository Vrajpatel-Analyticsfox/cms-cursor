import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { productTypeMaster, productGroupMaster } from '../db/schema';
import { CreateProductTypeDto, UpdateProductTypeDto } from './dto/product-type';
import { eq, and } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductTypeService {
  constructor(private eventEmitter: EventEmitter2) {}

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

    // Check for duplicate type ID
    const existingTypeId = await db
      .select()
      .from(productTypeMaster)
      .where(eq(productTypeMaster.typeId, createProductTypeDto.typeId))
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

    const [created] = await db.insert(productTypeMaster).values(createProductTypeDto).returning();

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

    const [updated] = await db
      .update(productTypeMaster)
      .set({
        ...updateProductTypeDto,
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
