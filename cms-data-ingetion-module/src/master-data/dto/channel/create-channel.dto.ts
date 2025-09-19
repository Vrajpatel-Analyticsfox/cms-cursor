import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChannelDto {
  @ApiPropertyOptional({
    description: 'Unique channel identifier (auto-generated if not provided)',
    example: 'CHANNEL_001',
  })
  @IsString()
  @IsOptional()
  channelId?: string;

  @IsNotEmpty()
  @IsString()
  channelName: string;

  @IsOptional()
  @IsString()
  channelType: string;

  @IsEnum(['Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled'])
  status: 'Active' | 'Inactive' | 'Draft' | 'Pending' | 'Completed' | 'Cancelled' = 'Active';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
