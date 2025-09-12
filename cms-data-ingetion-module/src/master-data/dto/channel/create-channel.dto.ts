import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateChannelDto {
  @IsNotEmpty()
  @IsString()
  channelId: string;

  @IsNotEmpty()
  @IsString()
  channelName: string;

  @IsOptional()
  @IsString()
  channelType: string;

  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive' = 'active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
