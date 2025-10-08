import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { PrismaService } from 'src/database/prisma.service';

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
      select:{
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user:{
          select:{
            name: true,
            email: true
          }
        }
      }
    });
  }

  async findAll() {
    return await this.prisma.answers.findMany({
      select:{
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user:{
          select:{
            name: true,
            email: true
          }
        }
      }
    });
  }

  async findOne(id: number) {
    const answer = await this.prisma.answers.findUnique({ where: { id } });

    if (!answer) {
      throw new NotFoundException(`Answer with id ${id} not found`);
    }

    return await this.prisma.answers.findUnique({ where: { id } });
  }

  async update(id: number, updateAnswerDto: UpdateAnswerDto) {
    const answer = await this.prisma.answers.findUnique({ where: { id } });

    if (!answer) {
      throw new NotFoundException(`Answer with id ${id} not found`);
    }

    return await this.prisma.answers.update({
      where: { id },
      data: updateAnswerDto,
      select:{
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user:{
          select:{
            name: true,
            email: true
          }
        }
      }
    });
  }

  async remove(id: number) {
    const answer = await this.prisma.answers.findUnique({ where: { id } });

    if (!answer) {
      throw new NotFoundException(`Answer with id ${id} not found`);
    }

    return await this.prisma.answers.delete({ 
      where: { id },
      select:{
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user:{
          select:{
            name: true,
            email: true
          }
        }
      }
    });
  }
}
