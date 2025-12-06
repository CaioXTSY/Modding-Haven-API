import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: ['USER', 'ADMIN'] })
  @IsEnum(['USER', 'ADMIN'])
  @IsOptional()
  role?: 'USER' | 'ADMIN';
}
