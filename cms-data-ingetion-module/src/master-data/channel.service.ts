import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { channelMaster, users } from '../db/schema';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel';
import { eq, desc, sql } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChannelService {
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
    } catch {
      return 'system';
    }
  }

  /**
   * Generate next numeric channelId
   */
  private async generateNextChannelId(): Promise<string> {
    try {
      // Get the highest numeric channelId
      const result = await db
        .select({ channelId: channelMaster.channelId })
        .from(channelMaster)
        .where(sql`${channelMaster.channelId} ~ '^[0-9]+$'`)
        .orderBy(desc(sql`CAST(${channelMaster.channelId} AS INTEGER)`))
        .limit(1);

      if (result.length === 0) {
        return '1'; // First channel
      }

      const lastId = parseInt(result[0].channelId);
      return (lastId + 1).toString();
    } catch {
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  }

  async create(createChannelDto: CreateChannelDto) {
    // Validate channel type
    // const validChannelTypes = ['SMS', 'WhatsApp', 'IVR', 'Email'];
    // if (!validChannelTypes.includes(createChannelDto.channelType)) {
    //   throw new BadRequestException(
    //     `Invalid channel type. Must be one of: ${validChannelTypes.join(', ')}`,
    //   );
    // }

    // Validate channel name
    // const validChannelName = ['SMS', 'WhatsApp', 'IVR', 'Email'];
    // if (!validChannelName.includes(createChannelDto.channelName)) {
    //   throw new BadRequestException(
    //     `Invalid channel name. Must be one of: ${validChannelName.join(', ')}`,
    //   );
    // }

    // Generate channelId if not provided
    let channelId = createChannelDto.channelId;
    if (!channelId) {
      channelId = await this.generateNextChannelId();
    }

    // Check for duplicate channel ID
    const existingChannelId = await db
      .select()
      .from(channelMaster)
      .where(eq(channelMaster.channelId, channelId))
      .limit(1);

    if (existingChannelId.length > 0) {
      throw new ConflictException('Channel ID already exists');
    }

    // Get user information
    const userInfo = await this.getUserInfo(createChannelDto.createdBy);

    // Create channel with generated ID and resolved user
    const channelData = {
      ...createChannelDto,
      channelId: channelId,
      createdBy: userInfo,
    };

    const [created] = await db.insert(channelMaster).values(channelData).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'channel',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db
      .select({
        id: channelMaster.id,
        channelId: channelMaster.channelId,
        channelName: channelMaster.channelName,
        channelType: channelMaster.channelType,
        status: channelMaster.status,
        description: channelMaster.description,
        createdAt: channelMaster.createdAt,
        updatedAt: channelMaster.updatedAt,
        createdBy: users.fullName,
        updatedBy: sql<string>`updated_user.full_name`.as('updatedBy'),
      })
      .from(channelMaster)
      .leftJoin(users, eq(sql`${channelMaster.createdBy}::uuid`, users.id))
      .leftJoin(
        sql`${users} as updated_user`,
        eq(sql`${channelMaster.updatedBy}::uuid`, sql`updated_user.id`),
      )
      .orderBy(channelMaster.channelName);
  }

  async findActive() {
    return db
      .select({
        id: channelMaster.id,
        channelId: channelMaster.channelId,
        channelName: channelMaster.channelName,
        channelType: channelMaster.channelType,
        status: channelMaster.status,
        description: channelMaster.description,
        createdAt: channelMaster.createdAt,
        updatedAt: channelMaster.updatedAt,
        createdBy: users.fullName,
        updatedBy: sql<string>`updated_user.full_name`.as('updatedBy'),
      })
      .from(channelMaster)
      .leftJoin(users, eq(sql`${channelMaster.createdBy}::uuid`, users.id))
      .leftJoin(
        sql`${users} as updated_user`,
        eq(sql`${channelMaster.updatedBy}::uuid`, sql`updated_user.id`),
      )
      .where(eq(channelMaster.status, 'Active'))
      .orderBy(channelMaster.channelName);
  }

  async findOne(id: string) {
    const [result] = await db
      .select({
        id: channelMaster.id,
        channelId: channelMaster.channelId,
        channelName: channelMaster.channelName,
        channelType: channelMaster.channelType,
        status: channelMaster.status,
        description: channelMaster.description,
        createdAt: channelMaster.createdAt,
        updatedAt: channelMaster.updatedAt,
        createdBy: users.fullName,
        updatedBy: sql<string>`updated_user.full_name`.as('updatedBy'),
      })
      .from(channelMaster)
      .leftJoin(users, eq(sql`${channelMaster.createdBy}::uuid`, users.id))
      .leftJoin(
        sql`${users} as updated_user`,
        eq(sql`${channelMaster.updatedBy}::uuid`, sql`updated_user.id`),
      )
      .where(eq(channelMaster.id, id));

    if (!result) {
      throw new NotFoundException(`Channel with ID ${id} not found`);
    }

    return result;
  }

  async update(id: string, updateChannelDto: UpdateChannelDto) {
    // Check if channel exists
    const existingChannel = await this.findOne(id);

    // If updating channel ID, check for duplicates
    if (updateChannelDto.channelId && updateChannelDto.channelId !== existingChannel.channelId) {
      const duplicateChannelId = await db
        .select()
        .from(channelMaster)
        .where(eq(channelMaster.channelId, updateChannelDto.channelId))
        .limit(1);

      if (duplicateChannelId.length > 0) {
        throw new ConflictException('Channel ID already exists');
      }
    }

    // If updating channel name, check for duplicates
    // if (
    //   updateChannelDto.channelName &&
    //   updateChannelDto.channelName !== existingChannel.channelName
    // ) {
    //   const duplicateChannelName = await db
    //     .select()
    //     .from(channelMaster)
    //     .where(eq(channelMaster.channelName, updateChannelDto.channelName))
    //     .limit(1);

    //   if (duplicateChannelName.length > 0) {
    //     throw new ConflictException('Channel name already exists');
    //   }
    // }

    // Validate channel name
    // if (updateChannelDto.channelName) {
    //   const validChannelName = ['SMS', 'WhatsApp', 'IVR', 'Email'];
    //   if (!validChannelName.includes(updateChannelDto.channelName)) {
    //     throw new BadRequestException(
    //       `Invalid channel name. Must be one of: ${validChannelName.join(', ')}`,
    //     );
    //   }
    // }

    // If updating channel type, validate it
    // if (updateChannelDto.channelType) {
    //   const validChannelTypes = ['SMS', 'WhatsApp', 'IVR', 'Email'];
    //   if (!validChannelTypes.includes(updateChannelDto.channelType)) {
    //     throw new BadRequestException(
    //       `Invalid channel type. Must be one of: ${validChannelTypes.join(', ')}`,
    //     );
    //   }
    // }

    // Get user information for updatedBy
    let updatedBy = updateChannelDto.updatedBy;
    if (updatedBy) {
      updatedBy = await this.getUserInfo(updatedBy);
    }

    const [updated] = await db
      .update(channelMaster)
      .set({
        ...updateChannelDto,
        updatedBy: updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(channelMaster.id, id))
      .returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'channel',
      action: 'updated',
      data: updated,
    });

    return updated;
  }

  async remove(id: string) {
    // check if channel exists
    await this.findOne(id);

    const [deleted] = await db.delete(channelMaster).where(eq(channelMaster.id, id)).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'channel',
      action: 'deleted',
      data: deleted,
    });

    return deleted;
  }

  // async findByType(channelType: string) {
  //   return db
  //     .select()
  //     .from(channelMaster)
  //     .where(eq(channelMaster.channelType, channelType))
  //     .orderBy(channelMaster.channelName);
  // }

  // async findActiveByType(channelType: string) {
  //   return db
  //     .select()
  //     .from(channelMaster)
  //     .where(and(eq(channelMaster.channelType, channelType), eq(channelMaster.status, 'active')))
  //     .orderBy(channelMaster.channelName);
  // }
}
