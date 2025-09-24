import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateLawyerAllocationDto } from './create-lawyer-allocation.dto';
import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateLawyerAllocationDto extends PartialType(CreateLawyerAllocationDto) {
  @ApiProperty({
    description: 'Status of the allocation',
    enum: ['Active', 'Completed', 'Cancelled', 'Reassigned'],
    example: 'Active',
    required: false,
  })
  @IsEnum(['Active', 'Completed', 'Cancelled', 'Reassigned'])
  @IsOptional()
  status?: 'Active' | 'Completed' | 'Cancelled' | 'Reassigned';

  @ApiProperty({
    description: 'Checkbox/flag indicating lawyer has accepted the assignment',
    example: true,
    required: false,
  })
  @IsOptional()
  lawyerAcknowledgement?: boolean;

  @ApiProperty({
    description: 'Additional notes or context',
    example: 'Lawyer confirmed availability',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  remarks?: string;
}
