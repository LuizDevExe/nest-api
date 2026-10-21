import { Injectable, NotFoundException } from '@nestjs/common';
import { assertOwner } from 'src/auth/ownership';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationQueryDto, toPage } from 'src/common/pagination';
import { AUTHOR } from 'src/common/author';

// o que a listagem devolve de cada post: o autor e as respostas com seus autores
const POST_LIST_SELECT = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  user: AUTHOR,
  answers: {
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      user: AUTHOR,
    },
  },
} as const;

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
        user: AUTHOR,
      },
    });
  }

  // do mais novo para o mais antigo; o id desempata posts criados no mesmo instante
  async findAll(query: PaginationQueryDto) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: POST_LIST_SELECT,
      }),
      this.prisma.post.count(),
    ]);
    return toPage(data, total, query);
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
        user: AUTHOR,
        answers: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: AUTHOR,
          },
        },
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
        user: AUTHOR,
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
        user: AUTHOR,
      },
    });
  }
}
