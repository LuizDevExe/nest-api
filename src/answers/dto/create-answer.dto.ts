import { IsNotEmpty, MaxLength } from "class-validator";

export class CreateAnswerDto {
  @MaxLength(255)
  @IsNotEmpty()
  content: string;
}
