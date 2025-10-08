import { name } from './../../node_modules/ci-info/index.d';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return await this.prisma.post.create({
      data: {
        ...createPostDto,
        user: {
          connect: { id: userId },
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        answers: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return await this.prisma.post.findUnique({ where: { id } });
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if ('id' in updatePostDto) {
          delete updatePostDto.id;
          throw new BadRequestException('The field id cannot be modified');
        }

    if (!post) {
      throw new NotFoundException(`Post with ${id} not found`);
    }

    return await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ${id} not found`);
    }

    await this.prisma.answers.deleteMany({
      where: { postId: id },
    });

    return await this.prisma.post.delete({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        userId: false,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
