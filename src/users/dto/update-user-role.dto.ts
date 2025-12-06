import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['USER', 'ADMIN'] })
  @IsEnum(['USER', 'ADMIN'])
  role: 'USER' | 'ADMIN';
}
