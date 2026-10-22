import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

// a comunidade não é editável depois de criado o post
export class UpdatePostDto extends PartialType(
  OmitType(CreatePostDto, ['communitySlug'] as const),
) {}
