import { ApiProperty } from '@nestjs/swagger';

export class ModImageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  mime: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  url: string;
}
