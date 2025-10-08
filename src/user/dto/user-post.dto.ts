import { Transform } from "class-transformer";
import {  IsEmail, IsNotEmpty, IsStrongPassword, Matches } from "class-validator";


export class CreateUserDto{

    @IsEmail()
    @IsNotEmpty()	
    email: string;

    @IsNotEmpty()
    @Matches(/^[A-Za-zÀ-ÿ ']+$/, { message: 'Name can only contain letters, spaces and accents' })
    name: string;

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