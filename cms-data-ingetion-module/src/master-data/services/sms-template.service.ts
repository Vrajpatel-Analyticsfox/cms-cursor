import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../db/drizzle.config';
import { eq } from 'drizzle-orm';
import { templateMaster, channelMaster } from '../../db/schema';
import { SmsApiService } from './sms-api.service';
import { TemplateFormatService } from './template-format.service';
import { CreateSmsTemplateRequest, SmsTemplate } from '../dto/sms/sms-api.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';

@Injectable()
export class SmsTemplateService {
  private readonly logger = new Logger(SmsTemplateService.name);

  constructor(
    private readonly smsApiService: SmsApiService,
    private readonly templateFormatService: TemplateFormatService,
  ) {}

  /**
   * Check if a channel is SMS channel
   */
  async isSmsChannel(channelId: string): Promise<boolean> {
    try {
      const channel = await db
        .select()
        .from(channelMaster)
        .where(eq(channelMaster.id, channelId))
        .limit(1);

      if (channel.length === 0) {
        return false;
      }

      const channelName = channel[0].channelName.toLowerCase();
      return channelName.includes('sms') || channelName === 'sms';
    } catch (error) {
      this.logger.error('Failed to check SMS channel', error);
      return false;
    }
  }

  /**
   * Create SMS template and sync with external API
   */
  async createSmsTemplate(createTemplateDto: CreateTemplateDto): Promise<any> {
    try {
      // Check if channel is SMS
      const isSms = await this.isSmsChannel(createTemplateDto.channelId);

      if (!isSms) {
        this.logger.log('Channel is not SMS, skipping SMS API integration');
        return null;
      }

      if (!this.smsApiService.isConfigured()) {
        this.logger.warn('SMS API not configured, skipping SMS template creation');
        return null;
      }

      // Generate a temporary template ID for SMS API
      const tempTemplateId = `temp_${Date.now()}`;

      // Convert template format for SMS API
      const smsFormattedMessage = this.templateFormatService.convertToSmsFormat(
        createTemplateDto.messageBody,
      );

      // Create template in SMS API
      const smsTemplateData: Omit<CreateSmsTemplateRequest, 'apiKey' | 'clientId'> = {
        templateName: createTemplateDto.templateName,
        messageTemplate: smsFormattedMessage,
        templateId: tempTemplateId,
      };

      const smsResponse = await this.smsApiService.createTemplate(smsTemplateData);

      if (smsResponse.ErrorCode === 0) {
        this.logger.log(`SMS template created successfully with temp ID: ${tempTemplateId}`);

        // Wait a bit and then fetch the created template to get the actual DLT Template ID
        await this.delay(2000); // Wait 2 seconds

        const createdTemplate = await this.smsApiService.findTemplateByDltId(tempTemplateId);

        if (createdTemplate) {
          this.logger.log(
            `Found created SMS template with DLT ID: ${createdTemplate.DltTemplateId}`,
          );
          return {
            smsTemplateId: createdTemplate.TemplateId,
            dltTemplateId: createdTemplate.DltTemplateId,
            isApproved: createdTemplate.IsApproved,
            isActive: createdTemplate.IsActive,
            // Note: We don't generate templateId here anymore - let the main service handle numeric generation
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to create SMS template', error);
      throw new BadRequestException('Failed to create SMS template');
    }
  }

  /**
   * Update SMS template and sync with external API
   */
  async updateSmsTemplate(templateId: string, updateData: any): Promise<any> {
    try {
      // Get the template from our database
      const template = await db
        .select()
        .from(templateMaster)
        .where(eq(templateMaster.id, templateId))
        .limit(1);

      if (template.length === 0) {
        throw new NotFoundException('Template not found');
      }

      // Check if channel is SMS
      const isSms = await this.isSmsChannel(template[0].channelId);

      if (!isSms) {
        this.logger.log('Channel is not SMS, skipping SMS API integration');
        return null;
      }

      if (!this.smsApiService.isConfigured()) {
        this.logger.warn('SMS API not configured, skipping SMS template update');
        return null;
      }

      // Check if we have SMS template ID stored
      if (!template[0].smsTemplateId) {
        this.logger.warn('No SMS template ID found, cannot update SMS template');
        return null;
      }

      // Convert template format for SMS API
      const messageToUpdate = updateData.messageBody || template[0].messageBody;
      const smsFormattedMessage = this.templateFormatService.convertToSmsFormat(messageToUpdate);

      // Update template in SMS API
      const smsUpdateData = {
        templateName: updateData.templateName || template[0].templateName,
        messageTemplate: smsFormattedMessage,
        templateId: template[0].dltTemplateId || `temp_${Date.now()}`,
      };

      const smsResponse = await this.smsApiService.updateTemplate(
        template[0].smsTemplateId,
        smsUpdateData,
      );

      if (smsResponse.ErrorCode === 0) {
        this.logger.log(`SMS template updated successfully for template ID: ${templateId}`);
        return {
          success: true,
          message: 'SMS template updated successfully',
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to update SMS template', error);
      throw new BadRequestException('Failed to update SMS template');
    }
  }

  /**
   * Delete SMS template and sync with external API
   */
  async deleteSmsTemplate(templateId: string): Promise<any> {
    try {
      // Get the template from our database
      const template = await db
        .select()
        .from(templateMaster)
        .where(eq(templateMaster.id, templateId))
        .limit(1);

      if (template.length === 0) {
        throw new NotFoundException('Template not found');
      }

      // Check if channel is SMS
      const isSms = await this.isSmsChannel(template[0].channelId);

      if (!isSms) {
        this.logger.log('Channel is not SMS, skipping SMS API integration');
        return null;
      }

      if (!this.smsApiService.isConfigured()) {
        this.logger.warn('SMS API not configured, skipping SMS template deletion');
        return null;
      }

      // Check if we have SMS template ID stored
      if (!template[0].smsTemplateId) {
        this.logger.warn('No SMS template ID found, cannot delete SMS template');
        return null;
      }

      // Delete template from SMS API
      const smsResponse = await this.smsApiService.deleteTemplate(template[0].smsTemplateId);

      if (smsResponse.ErrorCode === 0) {
        this.logger.log(`SMS template deleted successfully for template ID: ${templateId}`);
        return {
          success: true,
          message: 'SMS template deleted successfully',
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to delete SMS template', error);
      throw new BadRequestException('Failed to delete SMS template');
    }
  }

  /**
   * Sync SMS template status from external API
   */
  async syncSmsTemplateStatus(templateId: string): Promise<any> {
    try {
      // Get the template from our database
      const template = await db
        .select()
        .from(templateMaster)
        .where(eq(templateMaster.id, templateId))
        .limit(1);

      if (template.length === 0) {
        throw new NotFoundException('Template not found');
      }

      // Check if channel is SMS
      const isSms = await this.isSmsChannel(template[0].channelId);

      if (!isSms) {
        this.logger.log('Channel is not SMS, skipping SMS status sync');
        return null;
      }

      if (!this.smsApiService.isConfigured()) {
        this.logger.warn('SMS API not configured, skipping SMS status sync');
        return null;
      }

      // Check if we have DLT template ID stored
      if (!template[0].dltTemplateId) {
        this.logger.warn('No DLT template ID found, cannot sync SMS template status');
        return null;
      }

      // Find the template in SMS API
      const smsTemplate = await this.smsApiService.findTemplateByDltId(template[0].dltTemplateId);

      if (smsTemplate) {
        // Update our database with the latest status
        await db
          .update(templateMaster)
          .set({
            smsTemplateId: smsTemplate.TemplateId,
            isApproved: smsTemplate.IsApproved,
            isActive: smsTemplate.IsActive,
            updatedAt: new Date(),
          })
          .where(eq(templateMaster.id, templateId));

        this.logger.log(`SMS template status synced for template ID: ${templateId}`);
        return {
          success: true,
          isApproved: smsTemplate.IsApproved,
          isActive: smsTemplate.IsActive,
          message: 'SMS template status synced successfully',
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to sync SMS template status', error);
      throw new BadRequestException('Failed to sync SMS template status');
    }
  }

  /**
   * Get all SMS templates from external API
   */
  async getAllSmsTemplates(): Promise<SmsTemplate[]> {
    try {
      if (!this.smsApiService.isConfigured()) {
        this.logger.warn('SMS API not configured, cannot fetch SMS templates');
        return [];
      }

      const templates = await this.smsApiService.getAllTemplates();

      // Convert templates back to internal format for display
      return templates.map((template) => ({
        ...template,
        MessageTemplate: this.templateFormatService.convertFromSmsFormat(template.MessageTemplate),
      }));
    } catch (error) {
      this.logger.error('Failed to get SMS templates', error);
      throw new BadRequestException('Failed to get SMS templates');
    }
  }

  /**
   * Helper method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
