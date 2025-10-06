import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: {email: data.email}
    })

    if (existingUser) {
    throw new HttpException('Email já cadastrado', HttpStatus.CONFLICT);
  }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {...data, password: passwordHash}
    });
  }

  async getUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;

    const user = await this.prisma.user.findUnique({ where });

    if (!user) {
      throw new NotFoundException(`Usuário com id ${where.id} não encontrado`);
    }


    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.prisma.user.findUnique({ where });

    if (!user) {
      throw new NotFoundException(`Usuário com id ${where.id} não encontrado`);
    }

    return this.prisma.user.delete({ where });
  }
}
