import { Injectable, NotFoundException } from '@nestjs/common';
import { assertOwner } from 'src/auth/ownership';
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
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: number) {
    assertOwner(
      await this.prisma.post.findUnique({ where: { id } }),
      userId,
      'Post',
    );

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

  // as respostas saem junto (onDelete: Cascade no schema)
  async remove(id: number, userId: number) {
    assertOwner(
      await this.prisma.post.findUnique({ where: { id } }),
      userId,
      'Post',
    );

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
