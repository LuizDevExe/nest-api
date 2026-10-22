import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

// usado por bans e transferência de posse: { userId }
export class UserTargetDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  userId: number;
}
