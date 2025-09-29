import { Injectable } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { db } from '../db/drizzle.config';
import { tenant, users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TenantService {
  async createTenant(createTenantDto: CreateTenantDto) {
    // 1. Create tenant in DB
    const [createdTenant] = await db
      .insert(tenant)
      .values({
        username: createTenantDto.username,
        password: createTenantDto.password, // Hash in production!
      })
      .returning();

    // 2. Use keycloakId from request body or generate stub
    const keycloakId = createTenantDto.keycloakId;

    // 3. Create tenant admin in users table
    const [adminUser] = await db
      .insert(users)
      .values({
        tenantId: createdTenant.id,
        fullName: createTenantDto.adminFullName,
        email: createTenantDto.adminEmail,
        mobile: createTenantDto.adminMobile,
        address: createTenantDto.adminAddress,
        role: createTenantDto.role,
        keycloakId,
      })
      .returning();

    return {
      tenant: createdTenant,
      admin: adminUser,
      message: 'Tenant and admin user created (Keycloak integration stubbed)',
    };
  }

  async findAll() {
    return db.select().from(tenant);
  }

  async findOne(id: string) {
    const [result] = await db.select().from(tenant).where(eq(tenant.id, id));
    return result;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const [updated] = await db
      .update(tenant)
      .set(updateTenantDto)
      .where(eq(tenant.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await db.delete(tenant).where(eq(tenant.id, id)).returning();
    return deleted;
  }
}
