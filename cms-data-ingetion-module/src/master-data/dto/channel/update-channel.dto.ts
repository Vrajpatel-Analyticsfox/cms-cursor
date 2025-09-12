import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  channelName?: string;

  @IsOptional()
  @IsString()
  channelType?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
