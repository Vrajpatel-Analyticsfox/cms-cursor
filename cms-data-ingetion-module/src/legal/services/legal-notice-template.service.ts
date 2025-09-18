import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../db/drizzle.config';
import { eq, and, like, or } from 'drizzle-orm';
import { templateMaster } from '../../db/schema';
import { CreateLegalNoticeTemplateDto } from '../dto/create-legal-notice-template.dto';
import { UpdateLegalNoticeTemplateDto } from '../dto/update-legal-notice-template.dto';
import { LegalNoticeTemplateResponseDto } from '../dto/legal-notice-template-response.dto';

@Injectable()
export class LegalNoticeTemplateService {
  constructor() {}

  async create(createDto: CreateLegalNoticeTemplateDto): Promise<LegalNoticeTemplateResponseDto> {
    try {
      // Check if template ID already exists
      const existingTemplate = await db
        .select()
        .from(templateMaster)
        .where(eq(templateMaster.templateId, createDto.templateId))
        .limit(1);

      if (existingTemplate.length > 0) {
        throw new BadRequestException(`Template with ID '${createDto.templateId}' already exists`);
      }

      // Create new template
      const [newTemplate] = await db
        .insert(templateMaster)
        .values({
          templateId: createDto.templateId,
          templateName: createDto.templateName,
          templateType: createDto.templateType,
          messageBody: createDto.messageBody,
          languageId: createDto.languageId,
          channelId: createDto.channelId,
          description: createDto.description,
          status: createDto.status || 'Active',
          createdBy: createDto.createdBy || 'system',
        })
        .returning();

      return this.mapToResponseDto(newTemplate);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error creating template: ${error.message}`);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    templateType?: string,
    status?: string,
  ): Promise<{
    templates: LegalNoticeTemplateResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions: any[] = [];

      if (search) {
        conditions.push(
          or(
            like(templateMaster.templateName, `%${search}%`),
            like(templateMaster.templateId, `%${search}%`),
            like(templateMaster.description, `%${search}%`),
          ),
        );
      }

      if (templateType) {
        conditions.push(eq(templateMaster.templateType, templateType as any));
      }

      if (status) {
        conditions.push(eq(templateMaster.status, status as any));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get templates with pagination
      const templates = await db
        .select()
        .from(templateMaster)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(templateMaster.createdAt);

      // Get total count
      const totalResult = await db
        .select({ count: templateMaster.id })
        .from(templateMaster)
        .where(whereClause);

      const total = totalResult.length;

      return {
        templates: templates.map((template) => this.mapToResponseDto(template)),
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new BadRequestException(`Error fetching templates: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<LegalNoticeTemplateResponseDto> {
    try {
      const [template] = await db
        .select()
        .from(templateMaster)
        .where(eq(templateMaster.id, id))
        .limit(1);

      if (!template) {
        throw new NotFoundException(`Template with ID '${id}' not found`);
      }

      return this.mapToResponseDto(template);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error fetching template: ${error.message}`);
    }
  }

  async findByCode(templateCode: string): Promise<LegalNoticeTemplateResponseDto> {
    try {
      const [template] = await db
        .select()
        .from(templateMaster)
        .where(eq(templateMaster.templateId, templateCode))
        .limit(1);

      if (!template) {
        throw new NotFoundException(`Template with code '${templateCode}' not found`);
      }

      return this.mapToResponseDto(template);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error fetching template: ${error.message}`);
    }
  }

  async update(
    id: string,
    updateDto: UpdateLegalNoticeTemplateDto,
  ): Promise<LegalNoticeTemplateResponseDto> {
    try {
      // Check if template exists
      const existingTemplate = await this.findOne(id);

      // Check if template code is being changed and if it already exists
      if (updateDto.templateId && updateDto.templateId !== existingTemplate.templateCode) {
        const codeExists = await db
          .select()
          .from(templateMaster)
          .where(eq(templateMaster.templateId, updateDto.templateId))
          .limit(1);

        if (codeExists.length > 0) {
          throw new BadRequestException(
            `Template with ID '${updateDto.templateId}' already exists`,
          );
        }
      }

      // Update template
      const [updatedTemplate] = await db
        .update(templateMaster)
        .set({
          ...updateDto,
          updatedAt: new Date(),
        })
        .where(eq(templateMaster.id, id))
        .returning();

      return this.mapToResponseDto(updatedTemplate);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error updating template: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if template exists
      await this.findOne(id);

      // Hard delete
      await db.delete(templateMaster).where(eq(templateMaster.id, id));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error deleting template: ${error.message}`);
    }
  }

  private mapToResponseDto(template: any): LegalNoticeTemplateResponseDto {
    return {
      id: template.id,
      templateCode: template.templateId,
      templateName: template.templateName,
      templateType: template.templateType,
      templateContent: template.messageBody,
      languageId: template.languageId,
      channelId: template.channelId,
      description: template.description,
      status: template.status,
      createdBy: template.createdBy,
      updatedBy: template.updatedBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
