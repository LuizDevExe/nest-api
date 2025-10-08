import { MaxLength } from "class-validator";

export class CreateAnswerDto {
  @MaxLength(255)
  content: string;
}
