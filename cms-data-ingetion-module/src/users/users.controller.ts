import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('User Management')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a list of all users in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          username: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'supervisor'] },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
        },
      },
    },
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their numeric ID',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string', enum: ['admin', 'supervisor'] },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user with authentication credentials and role assignment',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        username: {
          type: 'string',
          example: 'john.doe',
        },
        email: {
          type: 'string',
          example: 'john.doe@example.com',
        },
        role: {
          type: 'string',
          enum: ['admin', 'supervisor'],
          example: 'admin',
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
    description: 'Conflict - username or email already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Username or email already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates an existing user with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string', enum: ['admin', 'supervisor'] },
        status: { type: 'string', enum: ['active', 'inactive'] },
        updatedAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
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
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft deletes a user by setting their status to inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User deleted successfully' },
        id: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
