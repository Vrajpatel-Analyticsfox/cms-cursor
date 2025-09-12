import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateLegalNoticeTemplateDto } from './create-legal-notice-template.dto';

export class UpdateLegalNoticeTemplateDto extends PartialType(CreateLegalNoticeTemplateDto) {
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
