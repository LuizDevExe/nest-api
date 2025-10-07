import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
    ) {}

  async signIn(params: Prisma.UserCreateInput
  ): Promise<{access_token: String}>{
    const user = await this.prisma.user.findUnique({ where:{email: params.email}});

    if (!user){
        throw new NotFoundException('Usuário Não encontrado');
    }

    const passwordMatch = await bcrypt.compare(params.password, user.password);
    
    if(!passwordMatch){
        throw new UnauthorizedException('Credenciais inválidas');
    }   

    const payload = { sub: user.id };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
