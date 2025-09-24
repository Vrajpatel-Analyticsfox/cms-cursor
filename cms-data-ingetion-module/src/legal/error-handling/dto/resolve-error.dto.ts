import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveErrorDto {
  @ApiProperty({
    description: 'Resolution notes explaining how the error was resolved',
    example: 'Fixed database connection pool configuration and restarted service',
  })
  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;

  @ApiProperty({
    description: 'User who resolved the error',
    example: 'admin@company.com',
  })
  @IsString()
  @IsNotEmpty()
  resolvedBy: string;
}
