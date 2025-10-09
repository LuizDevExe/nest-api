import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {  IsEmail, IsNotEmpty, IsStrongPassword, Matches } from "class-validator";


export class CreateUserDto {

    @ApiProperty({
        description: "Email do usuário"
    })
    @IsEmail()
    @IsNotEmpty()	
    email: string;

    @ApiProperty({
        description: "Nome do usuário, pode conter acentuação"
    })
    @IsNotEmpty()
    @Matches(/^[A-Za-zÀ-ÿ ']+$/, { message: 'Name can only contain letters, spaces and accents' })
    name: string;

    @ApiProperty({
        description: "Senha, deve conter no mínimo 10 caracteres, uma letra minúscula, uma maiúscula e um símbolo"
    })
    @IsNotEmpty()
    @IsStrongPassword(
        {
            minLength: 10,
        },
        {
            message: 'The password must be at least 10 characters long, including uppercase letters, lowercase letters, numbers, and symbols',
        }
    )
    password: string;
}
