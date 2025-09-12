import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChannelService } from './channel.service';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel';

@ApiTags('Master Data - Channel')
@Controller('master-data/channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new channel',
    description: 'Creates a new communication channel (SMS, WhatsApp, IVR, etc.)',
  })
  @ApiResponse({
    status: 201,
    description: 'Channel created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        channelId: {
          type: 'string',
          example: 'SMS001',
        },
        channelName: {
          type: 'string',
          example: 'SMS',
        },
        channelType: {
          type: 'string',
          example: 'Text',
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive'],
          example: 'active',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-21T10:30:00.000Z',
        },
        createdBy: {
          type: 'string',
          example: 'admin',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - channel ID already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Channel ID already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelService.create(createChannelDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all channels',
    description: 'Retrieves a list of all communication channels',
  })
  @ApiResponse({
    status: 200,
    description: 'Channels retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          channelId: { type: 'string' },
          channelName: { type: 'string' },
          channelType: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findAll() {
    return this.channelService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active channels',
    description: 'Retrieves a list of all active communication channels',
  })
  @ApiResponse({
    status: 200,
    description: 'Active channels retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          channelId: { type: 'string' },
          channelName: { type: 'string' },
          channelType: { type: 'string' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.channelService.findActive();
  }

  // @Get('by-type')
  // @ApiOperation({
  //   summary: 'Get channels by type',
  //   description: 'Retrieves channels filtered by channel type',
  // })
  // @ApiQuery({
  //   name: 'channelType',
  //   description: 'Channel type to filter by',
  //   example: 'Text',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Channels by type retrieved successfully',
  //   schema: {
  //     type: 'array',
  //     items: {
  //       type: 'object',
  //       properties: {
  //         id: { type: 'string', format: 'uuid' },
  //         channelId: { type: 'string' },
  //         channelName: { type: 'string' },
  //         channelType: { type: 'string' },
  //         status: { type: 'string', enum: ['active', 'inactive'] },
  //         createdAt: { type: 'string', format: 'date-time' },
  //         createdBy: { type: 'string' },
  //       },
  //     },
  //   },
  // })
  // async findByType(@Query('channelType') channelType: string) {
  //   return this.channelService.findByType(channelType);
  // }

  // @Get('active/by-type')
  // @ApiOperation({
  //   summary: 'Get active channels by type',
  //   description: 'Retrieves active channels filtered by channel type',
  // })
  // @ApiQuery({
  //   name: 'channelType',
  //   description: 'Channel type to filter by',
  //   example: 'Text',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Active channels by type retrieved successfully',
  //   schema: {
  //     type: 'array',
  //     items: {
  //       type: 'object',
  //       properties: {
  //         id: { type: 'string', format: 'uuid' },
  //         channelId: { type: 'string' },
  //         channelName: { type: 'string' },
  //         channelType: { type: 'string' },
  //         status: { type: 'string', enum: ['active'] },
  //         createdAt: { type: 'string', format: 'date-time' },
  //         createdBy: { type: 'string' },
  //       },
  //     },
  //   },
  // })
  // async findActiveByType(@Query('channelType') channelType: string) {
  //   return this.channelService.findActiveByType(channelType);
  // }

  @Get(':id')
  @ApiOperation({
    summary: 'Get channel by ID',
    description: 'Retrieves a specific channel by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Channel UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Channel retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        channelId: { type: 'string' },
        channelName: { type: 'string' },
        channelType: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Channel not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Channel not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.channelService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update channel',
    description: 'Updates an existing channel with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Channel UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Channel updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        channelId: { type: 'string' },
        channelName: { type: 'string' },
        channelType: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Channel not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Channel not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelService.update(id, updateChannelDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete channel',
    description: 'Soft deletes a channel by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'Channel UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Channel deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Channel deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Channel not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Channel not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.channelService.remove(id);
  }
}
