import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../db/drizzle.config';
import { eq, and, like, or } from 'drizzle-orm';
import { legalNoticeTemplates } from '../../db/schema';
import { CreateLegalNoticeTemplateDto } from '../dto/create-legal-notice-template.dto';
import { UpdateLegalNoticeTemplateDto } from '../dto/update-legal-notice-template.dto';
import { LegalNoticeTemplateResponseDto } from '../dto/legal-notice-template-response.dto';

@Injectable()
export class LegalNoticeTemplateService {
  constructor() {}

  async create(createDto: CreateLegalNoticeTemplateDto): Promise<LegalNoticeTemplateResponseDto> {
    try {
      // Check if template code already exists
      const existingTemplate = await db
        .select()
        .from(legalNoticeTemplates)
        .where(eq(legalNoticeTemplates.templateCode, createDto.templateCode))
        .limit(1);

      if (existingTemplate.length > 0) {
        throw new BadRequestException(
          `Template with code '${createDto.templateCode}' already exists`,
        );
      }

      // Create new template
      const [newTemplate] = await db
        .insert(legalNoticeTemplates)
        .values({
          templateCode: createDto.templateCode,
          templateName: createDto.templateName,
          templateType: createDto.templateType,
          templateContent: createDto.templateContent,
          languageId: createDto.languageId,
          maxCharacters: createDto.maxCharacters,
          description: createDto.description,
          status: createDto.status || 'active',
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
            like(legalNoticeTemplates.templateName, `%${search}%`),
            like(legalNoticeTemplates.templateCode, `%${search}%`),
            like(legalNoticeTemplates.description, `%${search}%`),
          ),
        );
      }

      if (templateType) {
        conditions.push(eq(legalNoticeTemplates.templateType, templateType as any));
      }

      if (status) {
        conditions.push(eq(legalNoticeTemplates.status, status as any));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get templates with pagination
      const templates = await db
        .select()
        .from(legalNoticeTemplates)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(legalNoticeTemplates.createdAt);

      // Get total count
      const totalResult = await db
        .select({ count: legalNoticeTemplates.id })
        .from(legalNoticeTemplates)
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
        .from(legalNoticeTemplates)
        .where(eq(legalNoticeTemplates.id, id))
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
        .from(legalNoticeTemplates)
        .where(eq(legalNoticeTemplates.templateCode, templateCode))
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
      if (updateDto.templateCode && updateDto.templateCode !== existingTemplate.templateCode) {
        const codeExists = await db
          .select()
          .from(legalNoticeTemplates)
          .where(eq(legalNoticeTemplates.templateCode, updateDto.templateCode))
          .limit(1);

        if (codeExists.length > 0) {
          throw new BadRequestException(
            `Template with code '${updateDto.templateCode}' already exists`,
          );
        }
      }

      // Update template
      const [updatedTemplate] = await db
        .update(legalNoticeTemplates)
        .set({
          ...updateDto,
          updatedAt: new Date(),
        })
        .where(eq(legalNoticeTemplates.id, id))
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
      await db.delete(legalNoticeTemplates).where(eq(legalNoticeTemplates.id, id));
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
      templateCode: template.templateCode,
      templateName: template.templateName,
      templateType: template.templateType,
      templateContent: template.templateContent,
      languageId: template.languageId,
      maxCharacters: template.maxCharacters,
      description: template.description,
      status: template.status,
      createdBy: template.createdBy,
      updatedBy: template.updatedBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
