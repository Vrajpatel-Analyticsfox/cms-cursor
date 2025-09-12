export class LegalNoticeTemplateResponseDto {
  id: string;
  templateCode: string;
  templateName: string;
  templateType: string;
  templateContent: string;
  languageId: string;
  maxCharacters?: number;
  description?: string;
  status: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
