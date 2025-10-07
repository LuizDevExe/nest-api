import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./user-post.dto";

export class UpdateUserDto extends PartialType(CreateUserDto){}