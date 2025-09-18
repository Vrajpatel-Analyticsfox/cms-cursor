import { Controller, Get, Post, Body, Param, Delete, Query, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StateService } from './state.service';
import { CreateStateDto } from './dto/state';
import { UpdateStateDto } from './dto/state';

@ApiTags('Master Data - State')
@Controller('master-data/state')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new state',
    description: 'Creates a new geographic state with unique state code and ID',
  })
  @ApiResponse({
    status: 201,
    description: 'State created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        stateCode: {
          type: 'string',
          example: 'MH',
        },
        stateName: {
          type: 'string',
          example: 'Maharashtra',
        },
        stateId: {
          type: 'string',
          example: 'STATE_001',
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
    description: 'Conflict - state code or ID already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'State code or ID already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  create(@Body() createStateDto: CreateStateDto) {
    return this.stateService.create(createStateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all states',
    description: 'Retrieves a list of all states with optional filtering',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter states by status',
    schema: {
      type: 'string',
      enum: ['active', 'inactive'],
      example: 'active',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'States retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          stateCode: { type: 'string' },
          stateName: { type: 'string' },
          stateId: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  findAll(@Query('status') status?: string) {
    if (status === 'active') {
      return this.stateService.findActive();
    }
    return this.stateService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active states',
    description: 'Retrieves a list of all active states',
  })
  @ApiResponse({
    status: 200,
    description: 'Active states retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          stateCode: { type: 'string' },
          stateName: { type: 'string' },
          stateId: { type: 'string' },
          status: { type: 'string', enum: ['active'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  async findActive() {
    return this.stateService.findActive();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get state by ID',
    description: 'Retrieves a specific state by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'State UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'State retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        stateCode: { type: 'string' },
        stateName: { type: 'string' },
        stateId: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'State not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'State not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.stateService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update state',
    description: 'Updates an existing state with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'State UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'State updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        stateCode: { type: 'string' },
        stateName: { type: 'string' },
        stateId: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'State not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'State not found' },
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
  update(@Param('id') id: string, @Body() updateStateDto: UpdateStateDto) {
    return this.stateService.update(id, updateStateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete state',
    description: 'Soft deletes a state by setting its status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'State UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'State deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'State deleted successfully' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete state due to foreign key constraints',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Cannot delete state. It is referenced by 5 record(s) in other tables.',
        },
        error: { type: 'string', example: 'Foreign Key Constraint Violation' },
        details: {
          type: 'object',
          properties: {
            stateId: { type: 'string', format: 'uuid' },
            totalReferences: { type: 'number', example: 5 },
            constraints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  table: { type: 'string', example: 'courts' },
                  count: { type: 'number', example: 3 },
                },
              },
            },
            constraintDetails: {
              type: 'string',
              example:
                '- 3 court(s) are associated with this state\n- 2 legal notice(s) are associated with this state',
            },
            suggestion: {
              type: 'string',
              example:
                'Please delete or reassign the associated records before deleting this state.',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'State not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'State not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.stateService.remove(id);
  }
}
