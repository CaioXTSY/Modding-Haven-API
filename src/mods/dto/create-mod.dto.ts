import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateModDto {
  @ApiProperty({ example: 'Ferramenta de Extração' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 'Extrai arquivos de mods rapidamente',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [String], required: false, example: ['ferramentas'] })
  @IsArray()
  @IsOptional()
  categories?: string[]; // slugs
}
