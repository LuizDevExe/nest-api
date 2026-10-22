import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new HttpException('Email já cadastrado', HttpStatus.CONFLICT);
    }

    const trimmedData = {
      ...data,
      name: data.name?.trim(),
      email: data.email?.trim(),
    };

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: { ...trimmedData, password: passwordHash },
    });

    const { password, ...result } = user;

    return result as UserResponseDto;
  }

  async getUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
      select: {
        id: true,
        email: true,
        name: true,
        password: false,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return user;
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<UserResponseDto> {
    const { where, data } = params;

    const existingUser = await this.prisma.user.findUnique({ where });
    if (!existingUser) {
      throw new NotFoundException(`User with id ${where.id} not found.`);
    }

    if (data.password && typeof data.password === 'string') {
      data.password = await bcrypt.hash(data.password, 10);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        data,
        where,
      });

      const { password, ...result } = updatedUser;
      return result as UserResponseDto;
    } catch (error) {
      // e-mail já usado por outra conta (restrição unique do banco)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This email is already registered in the system.',
        );
      }

      throw error;
    }
  }

  async deleteUser(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where });

    if (!user) {
      throw new NotFoundException(`Usuário com id ${where.id} não encontrado`);
    }

    const ownsACommunity = new ConflictException(
      'Transfira a posse ou apague a comunidade antes de apagar a conta',
    );

    // o usuário, os posts, as respostas e as memberships dele saem juntos, ou nada sai.
    // A checagem de dono vale na hora da escrita: o deleteMany não apaga linhas OWNER, e se uma
    // transferência deu a posse a ele no meio do caminho, a FK RESTRICT de Membership.userId
    // faz o user.delete falhar (P2003), que vira o mesmo 409.
    try {
      return await this.prisma.$transaction(async (tx) => {
        const owned = await tx.membership.findFirst({
          where: { userId: user.id, role: 'OWNER' },
        });
        if (owned) throw ownsACommunity;

        await tx.answers.deleteMany({ where: { userId: user.id } });
        await tx.post.deleteMany({ where: { userId: user.id } });
        await tx.membership.deleteMany({
          where: { userId: user.id, role: { not: 'OWNER' } },
        });
        return tx.user.delete({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            password: false,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw ownsACommunity;
      }
      throw error;
    }
  }
}
