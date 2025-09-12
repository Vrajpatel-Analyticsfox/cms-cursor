import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { db } from '../db/drizzle.config';
import { channelMaster } from '../db/schema';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel';
import { eq } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChannelService {
  constructor(private eventEmitter: EventEmitter2) {}

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

    // Check for duplicate channel ID
    const existingChannelId = await db
      .select()
      .from(channelMaster)
      .where(eq(channelMaster.channelId, createChannelDto.channelId))
      .limit(1);

    if (existingChannelId.length > 0) {
      throw new ConflictException('Channel ID already exists');
    }

    // Check for duplicate channel name within the same type
    // const existingChannelName = await db
    //   .select()
    //   .from(channelMaster)
    //   .where(eq(channelMaster.channelName, createChannelDto.channelName))
    //   .limit(1);

    // if (existingChannelName.length > 0) {
    //   throw new ConflictException('Channel name already exists');
    // }

    const [created] = await db.insert(channelMaster).values(createChannelDto).returning();

    // Emit event for downstream propagation
    this.eventEmitter.emit('masterData.updated', {
      entity: 'channel',
      action: 'created',
      data: created,
    });

    return created;
  }

  async findAll() {
    return db.select().from(channelMaster).orderBy(channelMaster.channelName);
  }

  async findActive() {
    return db
      .select()
      .from(channelMaster)
      .where(eq(channelMaster.status, 'active'))
      .orderBy(channelMaster.channelName);
  }

  async findOne(id: string) {
    const [result] = await db.select().from(channelMaster).where(eq(channelMaster.id, id));

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

    const [updated] = await db
      .update(channelMaster)
      .set({
        ...updateChannelDto,
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
