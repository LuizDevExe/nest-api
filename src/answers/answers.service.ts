import { Injectable, NotFoundException } from '@nestjs/common';
import { assertOwner } from 'src/auth/ownership';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { PrismaService } from 'src/database/prisma.service';
import { AUTHOR } from 'src/common/author';

@Injectable()
export class AnswersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createAnswerDto: CreateAnswerDto,
    userId: number,
    postId: number,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    const newAnswer = {
      content: createAnswerDto.content,
      user: {
        connect: { id: userId },
      },
      post: {
        connect: { id: postId },
      },
    };

    return this.prisma.answers.create({
      data: newAnswer,
      select: {
        id: true,
        postId: true,

        content: true,
        createdAt: true,
        updatedAt: true,
        user: AUTHOR,
      },
    });
  }

  async findAll() {
    return await this.prisma.answers.findMany({
      select: {
        id: true,
        postId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: AUTHOR,
      },
    });
  }

  async findOne(id: number) {
    const answer = await this.prisma.answers.findUnique({ where: { id } });

    if (!answer) {
      throw new NotFoundException(`Answer with id ${id} not found`);
    }

    return await this.prisma.answers.findUnique({
      where: { id },
      select: {
        id: true,
        postId: true,

        content: true,
        createdAt: true,
        updatedAt: true,
        user: AUTHOR,
      },
    });
  }

  async update(id: number, updateAnswerDto: UpdateAnswerDto, userId: number) {
    assertOwner(
      await this.prisma.answers.findUnique({ where: { id } }),
      userId,
      'Answer',
    );

    return await this.prisma.answers.update({
      where: { id },
      data: updateAnswerDto,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: AUTHOR,
      },
    });
  }

  async remove(id: number, userId: number) {
    assertOwner(
      await this.prisma.answers.findUnique({ where: { id } }),
      userId,
      'Answer',
    );

    return await this.prisma.answers.delete({
      where: { id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: AUTHOR,
      },
    });
  }
}
