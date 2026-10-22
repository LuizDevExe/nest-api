import { IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @MaxLength(40)
  title: string;

  @IsNotEmpty()
  @MaxLength(255)
  content: string;

  // comunidade onde o post é criado; ausente = feed geral
  @IsOptional()
  @Matches(/^[a-z0-9-]{3,30}$/, {
    message:
      'communitySlug must match ^[a-z0-9-]{3,30}$ (letras minúsculas, 3-30)',
  })
  communitySlug?: string;
}
