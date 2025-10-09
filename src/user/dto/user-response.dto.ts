import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  id: number;

  @ApiProperty()
  email: string;
  @ApiProperty()
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
