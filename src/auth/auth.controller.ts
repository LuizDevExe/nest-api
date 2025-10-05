import { AuthService } from './auth.service';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Prisma } from 'generated/prisma';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService){};

    @Post('signin')
    @HttpCode(HttpStatus.OK)
    signIn(@Body() body: Prisma.UserCreateInput){
        return this.authService.signIn(body);
    }
}
