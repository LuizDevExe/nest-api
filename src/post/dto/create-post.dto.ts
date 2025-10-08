import { IsNotEmpty, max, MaxLength } from "class-validator";

export class CreatePostDto {
    @IsNotEmpty()
    @MaxLength(40)
    title: string;

    @IsNotEmpty()
    @MaxLength(255)
    content: string;
}
