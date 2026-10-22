import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MaxLength, ValidateIf } from 'class-validator';

// slug não é editável, só nome e descrição (matriz: "editar nome e descrição")
export class UpdateCommunityDto {
  @ApiPropertyOptional({ example: 'Nest Brasil', maxLength: 40 })
  // não @IsOptional: ele deixaria passar null, e a coluna é NOT NULL (seria 500); ausente continua opcional
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty()
  @MaxLength(40)
  name?: string;

  @ApiPropertyOptional({ example: 'Nova descrição', maxLength: 255 })
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
