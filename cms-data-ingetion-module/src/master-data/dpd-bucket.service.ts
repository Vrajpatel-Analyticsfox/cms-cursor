import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { dpdBucketMaster, users } from '../db/schema';
import { CreateDpdBucketDto, UpdateDpdBucketDto } from './dto/dpd-bucket';
import { eq, and, or, gte, lte, ne, desc, sql } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DpdBucketService {
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
   * Generate next numeric bucketId
   */
  private async generateNextBucketId(): Promise<string> {
    try {
      // Get the highest numeric bucketId
      const result = await db
        .select({ bucketId: dpdBucketMaster.bucketId })
        .from(dpdBucketMaster)
        .where(sql`${dpdBucketMaster.bucketId} ~ '^[0-9]+$'`)
        .orderBy(desc(sql`CAST(${dpdBucketMaster.bucketId} AS INTEGER)`))
        .limit(1);

      if (result.length === 0) {
        return '1'; // First bucket
      }

      const lastId = parseInt(result[0].bucketId);
      return (lastId + 1).toString();
    } catch (error) {
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  }

  async create(createDpdBucketDto: CreateDpdBucketDto) {
    // Validate range (start <= end)
    if (createDpdBucketDto.rangeStart > createDpdBucketDto.rangeEnd) {
      throw new BadRequestException('Range start must be less than or equal to range end');
    }

    // Check for overlapping ranges in the same module
    const overlapping = await this.checkOverlappingRanges(
      createDpdBucketDto.rangeStart,
      createDpdBucketDto.rangeEnd,
      createDpdBucketDto.module,
      null, // exclude current record for updates
    );

    if (overlapping.length > 0) {
      throw new ConflictException('DPD bucket ranges cannot overlap within the same module');
    }

    // Generate bucketId if not provided
    let bucketId = createDpdBucketDto.bucketId;
    if (!bucketId) {
      bucketId = await this.generateNextBucketId();
    }

    // Check for duplicate bucket ID
    const existingBucketId = await db
      .select()
      .from(dpdBucketMaster)
      .where(eq(dpdBucketMaster.bucketId, bucketId))
      .limit(1);

    if (existingBucketId.length > 0) {
      throw new ConflictException('Bucket ID already exists');
    }

    // Get user information
    const userInfo = await this.getUserInfo(createDpdBucketDto.createdBy);

    // Transform DTO to match database schema field names
    const insertData = {
      bucketId: bucketId,
      bucketName: createDpdBucketDto.bucketName,
      rangeStart: createDpdBucketDto.rangeStart,
      rangeEnd: createDpdBucketDto.rangeEnd,
      minDays: createDpdBucketDto.minDays ?? createDpdBucketDto.rangeStart,
      maxDays: createDpdBucketDto.maxDays ?? createDpdBucketDto.rangeEnd,
      module: createDpdBucketDto.module,
      status: createDpdBucketDto.status || 'Active',
      description: createDpdBucketDto.description,
      createdBy: userInfo,
    };

    const [created] = await db.insert(dpdBucketMaster).values(insertData).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'dpdBucket',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(dpdBucketMaster).orderBy(dpdBucketMaster.bucketId);
  }

  async findActive() {
    return db
      .select()
      .from(dpdBucketMaster)
      .where(eq(dpdBucketMaster.status, 'Active'))
      .orderBy(dpdBucketMaster.bucketId);
  }

  async findOne(id: string) {
    const [result] = await db.select().from(dpdBucketMaster).where(eq(dpdBucketMaster.id, id));

    if (!result) {
      throw new NotFoundException(`DPD Bucket with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateDpdBucketDto: UpdateDpdBucketDto) {
    // Check if bucket exists
    const existingBucket = await this.findOne(id);

    // Validate range if updating
    if (updateDpdBucketDto.rangeStart !== undefined && updateDpdBucketDto.rangeEnd !== undefined) {
      if (updateDpdBucketDto.rangeStart > updateDpdBucketDto.rangeEnd) {
        throw new BadRequestException('Range start must be less than or equal to range end');
      }
    }

    // Check for overlapping ranges if updating range or module
    if (
      updateDpdBucketDto.rangeStart !== undefined ||
      updateDpdBucketDto.rangeEnd !== undefined ||
      updateDpdBucketDto.module !== undefined
    ) {
      const start = updateDpdBucketDto.rangeStart ?? existingBucket.rangeStart;
      const end = updateDpdBucketDto.rangeEnd ?? existingBucket.rangeEnd;
      const module = updateDpdBucketDto.module ?? existingBucket.module;

      const overlapping = await this.checkOverlappingRanges(start, end, module, id);

      if (overlapping.length > 0) {
        throw new ConflictException('DPD bucket ranges cannot overlap within the same module');
      }
    }

    // Check for duplicate bucket ID if updating
    if (updateDpdBucketDto.bucketId && updateDpdBucketDto.bucketId !== existingBucket.bucketId) {
      const duplicateBucketId = await db
        .select()
        .from(dpdBucketMaster)
        .where(eq(dpdBucketMaster.bucketId, updateDpdBucketDto.bucketId))
        .limit(1);

      if (duplicateBucketId.length > 0) {
        throw new ConflictException('Bucket ID already exists');
      }
    }

    // Transform DTO to match database schema field names
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are provided in the DTO
    if (updateDpdBucketDto.bucketId !== undefined)
      updateData.bucketId = updateDpdBucketDto.bucketId;
    if (updateDpdBucketDto.bucketName !== undefined)
      updateData.bucketName = updateDpdBucketDto.bucketName;
    if (updateDpdBucketDto.rangeStart !== undefined)
      updateData.rangeStart = updateDpdBucketDto.rangeStart;
    if (updateDpdBucketDto.rangeEnd !== undefined)
      updateData.rangeEnd = updateDpdBucketDto.rangeEnd;
    if (updateDpdBucketDto.minDays !== undefined) updateData.minDays = updateDpdBucketDto.minDays;
    if (updateDpdBucketDto.maxDays !== undefined) updateData.maxDays = updateDpdBucketDto.maxDays;
    if (updateDpdBucketDto.module !== undefined) updateData.module = updateDpdBucketDto.module;
    if (updateDpdBucketDto.status !== undefined) updateData.status = updateDpdBucketDto.status;
    if (updateDpdBucketDto.description !== undefined)
      updateData.description = updateDpdBucketDto.description;
    // Get user information for updatedBy
    if (updateDpdBucketDto.updatedBy !== undefined) {
      updateData.updatedBy = await this.getUserInfo(updateDpdBucketDto.updatedBy);
    }

    const [updated] = await db
      .update(dpdBucketMaster)
      .set(updateData)
      .where(eq(dpdBucketMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'dpdBucket',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    //const existingBucket = await this.findOne(id);

    const [deleted] = await db
      .delete(dpdBucketMaster)
      .where(eq(dpdBucketMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'dpdBucket',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }

  private async checkOverlappingRanges(
    start: number,
    end: number,
    module: string,
    excludeId: string | null,
  ) {
    // eq(dpdBucketMaster.module, module),
    let whereCondition = and(
      eq(dpdBucketMaster.status, 'Active'),
      or(
        // Check if ranges overlap
        and(gte(dpdBucketMaster.rangeStart, start), lte(dpdBucketMaster.rangeStart, end)),
        and(gte(dpdBucketMaster.rangeEnd, start), lte(dpdBucketMaster.rangeEnd, end)),
        and(lte(dpdBucketMaster.rangeStart, start), gte(dpdBucketMaster.rangeEnd, end)),
      ),
    );

    // Exclude current record for updates
    if (excludeId !== null) {
      whereCondition = and(whereCondition, ne(dpdBucketMaster.id, excludeId));
    }

    return db.select().from(dpdBucketMaster).where(whereCondition);
  }
}
