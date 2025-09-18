export class LegalNoticeTemplateResponseDto {
  id: string;
  templateCode: string; // Keep for backward compatibility
  templateName: string;
  templateType: string;
  templateContent: string; // Keep for backward compatibility
  languageId: string;
  channelId: string;
  description?: string;
  status: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
