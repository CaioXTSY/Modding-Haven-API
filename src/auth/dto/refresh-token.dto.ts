import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'refreshtokenjwt...' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
