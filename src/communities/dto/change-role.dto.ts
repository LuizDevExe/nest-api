import { ApiProperty } from '@nestjs/swagger';
import { CommunityRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ChangeRoleDto {
  @ApiProperty({ enum: CommunityRole, example: 'MODERATOR' })
  @IsEnum(CommunityRole)
  role: CommunityRole;
}
