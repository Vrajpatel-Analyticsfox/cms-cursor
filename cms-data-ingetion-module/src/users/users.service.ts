import { Injectable } from '@nestjs/common';
import { users } from '../db/schema';
import { db } from '../db/drizzle.config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  async createUser(createUserDto: CreateUserDto) {
    const [createdUser] = await db.insert(users).values(createUserDto).returning();
    return createdUser;
  }

  async findAll() {
    return db.select().from(users);
  }

  async findOne(id: string) {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const [updated] = await db.update(users).set(updateUserDto).where(eq(users.id, id)).returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    return deleted;
  }
}
