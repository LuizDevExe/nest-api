import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertOwner } from 'src/auth/ownership';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { PrismaService } from 'src/database/prisma.service';
import { AUTHOR } from 'src/common/author';
import { CommunitiesService } from 'src/communities/communities.service';
import { can } from 'src/communities/permissions';

@Injectable()
export class AnswersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly communitiesService: CommunitiesService,
  ) {}

  async create(
    createAnswerDto: CreateAnswerDto,
    userId: number,
    postId: number,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    if (post.communityId) {
      const role = await this.communitiesService.roleOf(
        post.communityId,
        userId,
      );
      if (!can(role, 'post')) {
        throw new ForbiddenException();
      }
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

  // autor apaga sempre; moderador ou acima apaga qualquer resposta da comunidade do post
  async remove(id: number, userId: number) {
    const answer = await this.prisma.answers.findUnique({ where: { id } });
    if (!answer) {
      throw new NotFoundException(`Answer with id ${id} not found`);
    }

    if (answer.userId !== userId) {
      const post = await this.prisma.post.findUnique({
        where: { id: answer.postId },
      });
      const role = post?.communityId
        ? await this.communitiesService.roleOf(post.communityId, userId)
        : null;
      if (!can(role, 'moderate')) {
        throw new ForbiddenException('Answer belongs to another user');
      }
    }

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
