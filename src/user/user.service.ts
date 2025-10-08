  import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
  import { PrismaService } from 'src/database/prisma.service';
  import { Prisma, User } from '@prisma/client';
  import * as bcrypt from 'bcrypt';
  import { UserResponseDto } from './dto/user-response.dto';

  @Injectable()
  export class UserService {
    constructor(private prisma: PrismaService) {}

    async createUser(data: Prisma.UserCreateInput):
      Promise<UserResponseDto>
    {
      const existingUser = await this.prisma.user.findUnique({
        where: {email: data.email}
      })

      if (existingUser) {
      throw new HttpException('Email já cadastrado', HttpStatus.CONFLICT);
    }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await this.prisma.user.create({
        data: {...data, password: passwordHash}
      });

      const {password, ...result} = user;

      return result as UserResponseDto;
    }

    async getUser(
      userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    ): Promise<Omit<User, 'password'> | null> {
      return this.prisma.user.findUnique({
        where: userWhereUniqueInput,
        select:{
          id: true,
          email: true,
          name: true,
          password: false,
          createdAt:true,
          updatedAt:true,
        }
      });
    }

    async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<UserResponseDto> {
    const { where, data } = params;

    
    const existingUser = await this.prisma.user.findUnique({ where });
    if (!existingUser) {
      throw new NotFoundException(`User with id ${where.id} not found`);
    }

    if (data.password && typeof data.password === 'string') {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      data,
      where,
    });

    const { password, ...result } = updatedUser;
    return result as UserResponseDto;
  }


    async deleteUser(where: Prisma.UserWhereUniqueInput): 
      Promise<Omit<User, 'password'>> {
      const user = await this.prisma.user.findUnique({ where });

      if (!user) {
        throw new NotFoundException(`Usuário com id ${where.id} não encontrado`);
      }

      return this.prisma.user.delete({ 
        where, 
        select:{
          id: true,
          email: true,
          name: true,
          password: false,
          createdAt:true,
          updatedAt:true,
        }
      });
    }
  }
