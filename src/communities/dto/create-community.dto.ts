import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty({ example: 'nest-br', pattern: '^[a-z0-9-]{3,30}$' })
  @Matches(/^[a-z0-9-]{3,30}$/, {
    message: 'slug must match ^[a-z0-9-]{3,30}$ (letras minúsculas, 3-30)',
  })
  slug: string;

  @ApiProperty({ example: 'Nest BR', maxLength: 40 })
  @IsNotEmpty()
  @MaxLength(40)
  name: string;

  @ApiPropertyOptional({ example: 'Comunidade sobre NestJS', maxLength: 255 })
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
