import { UserService } from './user.service';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { Prisma, User as UserModel } from '@prisma/client';

@Controller('user')
export class UserController {
    constructor( private readonly userService: UserService){}

    @Post('')
    async signupUser    (
        @Body() userData: Prisma.UserCreateInput)
    : Promise<UserModel>{
        return this.userService.createUser(userData)
    }

    @Get(':id')
    async getUserById(@Param('id') id: string): Promise<UserModel | null> {
    return this.userService.getUser({ id: Number(id) });
    }
}
