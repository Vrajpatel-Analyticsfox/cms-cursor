import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  SmsApiResponse,
  SmsTemplate,
  CreateSmsTemplateRequest,
  UpdateSmsTemplateRequest,
  SmsTemplateQueryParams,
} from '../dto/sms/sms-api.dto';

@Injectable()
export class SmsApiService {
  private readonly logger = new Logger(SmsApiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly clientId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('SMS_API_BASE_URL', 'http://localhost:82');
    this.apiKey = this.configService.get<string>('SMS_API_KEY') || '';
    this.clientId = this.configService.get<string>('SMS_CLIENT_ID') || '';

    if (!this.apiKey || !this.clientId) {
      this.logger.warn('SMS API credentials not configured. SMS template operations will fail.');
    }
  }

  /**
   * Get all SMS templates from external API
   */
  async getAllTemplates(): Promise<SmsTemplate[]> {
    try {
      const params = new URLSearchParams({
        ApiKey: this.apiKey,
        ClientId: this.clientId,
      });

      const response = await firstValueFrom(
        this.httpService.get<SmsApiResponse<SmsTemplate[]>>(
          `${this.baseUrl}/sms-api/templates?${params.toString()}`,
        ),
      );

      const responseData = response.data as SmsApiResponse<SmsTemplate[]>;

      if (responseData.ErrorCode !== 0) {
        throw new BadRequestException(`SMS API Error: ${responseData.ErrorDescription}`);
      }

      return responseData.Data || [];
    } catch (error) {
      this.logger.error('Failed to fetch SMS templates', error);
      throw new BadRequestException('Failed to fetch SMS templates from external API');
    }
  }

  /**
   * Create a new SMS template
   */
  async createTemplate(
    templateData: Omit<CreateSmsTemplateRequest, 'apiKey' | 'clientId'>,
  ): Promise<SmsApiResponse<null>> {
    try {
      const payload: CreateSmsTemplateRequest = {
        ...templateData,
        apiKey: this.apiKey,
        clientId: this.clientId,
      };

      const response = await firstValueFrom(
        this.httpService.post<SmsApiResponse<null>>(`${this.baseUrl}/sms-api/templates`, payload),
      );

      const responseData = response.data as SmsApiResponse<null>;

      if (responseData.ErrorCode !== 0) {
        throw new BadRequestException(`SMS API Error: ${responseData.ErrorDescription}`);
      }

      return responseData;
    } catch (error) {
      this.logger.error('Failed to create SMS template', error);
      throw new BadRequestException('Failed to create SMS template in external API');
    }
  }

  /**
   * Update an existing SMS template
   */
  async updateTemplate(
    templateId: number,
    templateData: Omit<UpdateSmsTemplateRequest, 'apiKey' | 'clientId'>,
  ): Promise<SmsApiResponse<null>> {
    try {
      const payload: UpdateSmsTemplateRequest = {
        ...templateData,
        apiKey: this.apiKey,
        clientId: this.clientId,
      };

      const response = await firstValueFrom(
        this.httpService.put<SmsApiResponse<null>>(
          `${this.baseUrl}/sms-api/templates/${templateId}`,
          payload,
        ),
      );

      const responseData = response.data as SmsApiResponse<null>;

      if (responseData.ErrorCode !== 0) {
        throw new BadRequestException(`SMS API Error: ${responseData.ErrorDescription}`);
      }

      return responseData;
    } catch (error) {
      this.logger.error('Failed to update SMS template', error);
      throw new BadRequestException('Failed to update SMS template in external API');
    }
  }

  /**
   * Delete an SMS template
   */
  async deleteTemplate(templateId: number): Promise<SmsApiResponse<null>> {
    try {
      const params = new URLSearchParams({
        ApiKey: this.apiKey,
        ClientId: this.clientId,
        id: templateId.toString(),
      });

      const response = await firstValueFrom(
        this.httpService.delete<SmsApiResponse<null>>(
          `${this.baseUrl}/sms-api/templates?${params.toString()}`,
        ),
      );

      const responseData = response.data as SmsApiResponse<null>;

      if (responseData.ErrorCode !== 0) {
        throw new BadRequestException(`SMS API Error: ${responseData.ErrorDescription}`);
      }

      return responseData;
    } catch (error) {
      this.logger.error('Failed to delete SMS template', error);
      throw new BadRequestException('Failed to delete SMS template from external API');
    }
  }

  /**
   * Find a template by DLT Template ID
   */
  async findTemplateByDltId(dltTemplateId: string): Promise<SmsTemplate | null> {
    try {
      const templates = await this.getAllTemplates();
      return templates.find((template) => template.DltTemplateId === dltTemplateId) || null;
    } catch (error) {
      this.logger.error('Failed to find template by DLT ID', error);
      return null;
    }
  }

  /**
   * Check if SMS API credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.clientId);
  }
}
