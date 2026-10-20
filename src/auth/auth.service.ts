import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';
import { SignInDto } from './dto/sign-in.dto';

// Hash de uma senha qualquer: e-mail desconhecido também paga um bcrypt.compare,
// para o tempo de resposta não revelar quem tem conta.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async signIn({
    email,
    password,
  }: SignInDto): Promise<{ access_token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordMatch = await bcrypt.compare(
      password,
      user?.password ?? DUMMY_HASH,
    );

    // mesma resposta para e-mail desconhecido e senha errada
    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: await this.jwtService.signAsync({ sub: user.id }),
    };
  }
}
