import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertOwner } from 'src/auth/ownership';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationQueryDto, toPage } from 'src/common/pagination';
import { AUTHOR } from 'src/common/author';
import { COMMUNITY_SELECT, POST_LIST_SELECT } from 'src/common/post-select';
import { CommunitiesService } from 'src/communities/communities.service';
import { can } from 'src/communities/permissions';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly communitiesService: CommunitiesService,
  ) {}

  async create(createPostDto: CreatePostDto, userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const { communitySlug, ...data } = createPostDto;
    let communityId: number | undefined;

    if (communitySlug) {
      const community = await this.prisma.community.findUnique({
        where: { slug: communitySlug },
      });
      if (!community) {
        throw new NotFoundException(`Community "${communitySlug}" not found`);
      }
      const role = await this.communitiesService.roleOf(community.id, userId);
      if (!can(role, 'post')) {
        throw new ForbiddenException();
      }
      communityId = community.id;
    }

    return await this.prisma.post.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
        ...(communityId ? { community: { connect: { id: communityId } } } : {}),
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
        community: COMMUNITY_SELECT,
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

  // as respostas saem junto (onDelete: Cascade no schema); autor apaga sempre,
  // moderador ou acima apaga qualquer post da comunidade
  async remove(id: number, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    if (post.userId !== userId) {
      const role = post.communityId
        ? await this.communitiesService.roleOf(post.communityId, userId)
        : null;
      if (!can(role, 'moderate')) {
        throw new ForbiddenException('Post belongs to another user');
      }
    }

    return await this.prisma.post.delete({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        user: AUTHOR,
      },
    });
  }
}
