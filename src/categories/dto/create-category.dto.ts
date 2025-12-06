import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Ferramentas' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ferramentas' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
