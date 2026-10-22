import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Community, CommunityRole, Membership, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationQueryDto, toPage } from 'src/common/pagination';
import { AUTHOR } from 'src/common/author';
import { POST_LIST_SELECT } from 'src/common/post-select';
import { can, rank } from './permissions';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { FindCommunitiesDto } from './dto/find-communities.dto';

const ACTIVE_MEMBERSHIP_COUNT = {
  _count: { select: { memberships: { where: { bannedAt: null } } } },
} as const;

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  // null para quem não é membro ou foi banido (consumido pelas tasks de post/answers também)
  async roleOf(
    communityId: number,
    userId: number,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<CommunityRole | null> {
    const membership = await db.membership.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    return membership && !membership.bannedAt ? membership.role : null;
  }

  async create(dto: CreateCommunityDto, userId: number) {
    const existing = await this.prisma.community.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" already in use`);
    }

    const community = await this.prisma
      .$transaction(async (tx) => {
        const created = await tx.community.create({ data: dto });
        await tx.membership.create({
          data: { userId, communityId: created.id, role: 'OWNER' },
        });
        return created;
      })
      .catch(
        conflictOnUnique(
          new ConflictException(`Slug "${dto.slug}" already in use`),
        ),
      );

    return this.present(community, 1, 'OWNER');
  }

  async findAll(query: FindCommunitiesDto, userId: number) {
    const where = query.mine
      ? { memberships: { some: { userId, bannedAt: null } } }
      : {};

    const [communities, total] = await this.prisma.$transaction([
      this.prisma.community.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          ...ACTIVE_MEMBERSHIP_COUNT,
        },
      }),
      this.prisma.community.count({ where }),
    ]);

    const memberships = await this.prisma.membership.findMany({
      where: { userId, communityId: { in: communities.map((c) => c.id) } },
      select: { communityId: true, role: true, bannedAt: true },
    });
    const roleByCommunity = new Map(
      memberships.map((m) => [m.communityId, m.bannedAt ? null : m.role]),
    );

    const data = communities.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      memberCount: c._count.memberships,
      myRole: roleByCommunity.get(c.id) ?? null,
    }));

    return toPage(data, total, query);
  }

  async findOne(slug: string, userId: number) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        ...ACTIVE_MEMBERSHIP_COUNT,
      },
    });
    if (!community) {
      throw new NotFoundException(`Community "${slug}" not found`);
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_communityId: { userId, communityId: community.id } },
    });

    return {
      slug: community.slug,
      name: community.name,
      description: community.description,
      memberCount: community._count.memberships,
      myRole: membership && !membership.bannedAt ? membership.role : null,
      banned: !!membership?.bannedAt,
    };
  }

  async update(slug: string, dto: UpdateCommunityDto, userId: number) {
    const community = await this.getCommunityOrThrow(slug);
    const role = await this.roleOf(community.id, userId);
    if (!can(role, 'edit')) throw new ForbiddenException();

    const updated = await this.prisma.community.update({
      where: { id: community.id },
      data: dto,
    });
    return this.present(updated, undefined, role);
  }

  async remove(slug: string, userId: number) {
    const community = await this.getCommunityOrThrow(slug);
    const role = await this.roleOf(community.id, userId);
    if (!can(role, 'delete')) throw new ForbiddenException();

    // cascata: memberships e posts (e as respostas deles) saem junto
    await this.prisma.community.delete({ where: { id: community.id } });
    return { slug: community.slug, name: community.name };
  }

  async join(slug: string, userId: number) {
    const community = await this.getCommunityOrThrow(slug);
    const membership = await this.prisma.membership.findUnique({
      where: { userId_communityId: { userId, communityId: community.id } },
    });
    if (membership?.bannedAt) {
      throw new ForbiddenException('You are banned from this community');
    }
    if (membership) {
      throw new ConflictException('Already a member of this community');
    }

    await this.prisma.membership
      .create({
        data: { userId, communityId: community.id, role: 'MEMBER' },
      })
      .catch(
        conflictOnUnique(
          new ConflictException('Already a member of this community'),
        ),
      );
    const memberCount = await this.prisma.membership.count({
      where: { communityId: community.id, bannedAt: null },
    });
    return this.present(community, memberCount, 'MEMBER');
  }

  async leave(slug: string, userId: number) {
    const community = await this.getCommunityOrThrow(slug);
    const membership = await this.getActiveMembership(community.id, userId);
    if (!can(membership.role, 'leave')) {
      throw new ConflictException(
        'The owner must transfer ownership before leaving',
      );
    }

    // condicional: se virou dono ou foi banido no meio do caminho, não apaga
    await this.writeOrConflict(
      this.prisma.membership.deleteMany({
        where: {
          userId,
          communityId: community.id,
          role: membership.role,
          bannedAt: null,
        },
      }),
    );
    return { slug: community.slug };
  }

  async changeRole(
    slug: string,
    targetUserId: number,
    newRole: CommunityRole,
    actorUserId: number,
  ) {
    const community = await this.getCommunityOrThrow(slug);
    await this.prisma.$transaction(async (tx) => {
      const actorRole = await this.roleOf(community.id, actorUserId, tx);
      const target = await this.getActiveMembership(
        community.id,
        targetUserId,
        tx,
      );

      if (!can(actorRole, 'changeRole', { role: target.role, newRole })) {
        throw new ForbiddenException();
      }

      await this.writeOrConflict(
        tx.membership.updateMany({
          where: {
            userId: targetUserId,
            communityId: community.id,
            role: target.role,
            bannedAt: null,
          },
          data: { role: newRole },
        }),
      );
    });
    return { userId: targetUserId, role: newRole };
  }

  async ban(slug: string, targetUserId: number, actorUserId: number) {
    const community = await this.getCommunityOrThrow(slug);
    const bannedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      const actorRole = await this.roleOf(community.id, actorUserId, tx);
      const target = await this.getActiveMembership(
        community.id,
        targetUserId,
        tx,
      );

      if (!can(actorRole, 'ban', { role: target.role })) {
        throw new ForbiddenException();
      }

      // bane e rebaixa para MEMBER
      await this.writeOrConflict(
        tx.membership.updateMany({
          where: {
            userId: targetUserId,
            communityId: community.id,
            role: target.role,
            bannedAt: null,
          },
          data: { role: 'MEMBER', bannedAt },
        }),
      );
    });
    return { userId: targetUserId, bannedAt };
  }

  async transfer(slug: string, targetUserId: number, actorUserId: number) {
    const community = await this.getCommunityOrThrow(slug);
    await this.prisma.$transaction(async (tx) => {
      const actorRole = await this.roleOf(community.id, actorUserId, tx);

      // mesma ordem de changeRole/ban: existência do alvo antes da permissão,
      // senão um não-dono transferindo para alvo inexistente/banido levaria 403 em vez do 404 uniforme
      await this.getActiveMembership(community.id, targetUserId, tx);

      if (!can(actorRole, 'transfer')) throw new ForbiddenException();

      // as duas escritas só valem se o ator ainda for o dono e o alvo ainda for membro ativo;
      // a segunda falhando desfaz a primeira (rollback da transação)
      await this.writeOrConflict(
        tx.membership.updateMany({
          where: {
            userId: actorUserId,
            communityId: community.id,
            role: 'OWNER',
            bannedAt: null,
          },
          data: { role: 'ADMIN' },
        }),
      );
      await this.writeOrConflict(
        tx.membership.updateMany({
          where: {
            userId: targetUserId,
            communityId: community.id,
            bannedAt: null,
          },
          data: { role: 'OWNER' },
        }),
      );
    });
    return { ownerId: targetUserId };
  }

  async members(slug: string, query: PaginationQueryDto) {
    const community = await this.getCommunityOrThrow(slug);
    const active = await this.prisma.membership.findMany({
      where: { communityId: community.id, bannedAt: null },
      orderBy: [{ createdAt: 'asc' }],
      select: { role: true, user: AUTHOR },
    });

    // Array.prototype.sort é estável: dentro do mesmo cargo mantém createdAt asc
    const sorted = [...active].sort((a, b) => rank(b.role) - rank(a.role));
    const start = (query.page - 1) * query.limit;
    const data = sorted.slice(start, start + query.limit);

    return toPage(data, sorted.length, query);
  }

  // mesmo formato de item que GET /post, filtrado pela comunidade
  async postsOf(slug: string, query: PaginationQueryDto) {
    const community = await this.getCommunityOrThrow(slug);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: { communityId: community.id },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: POST_LIST_SELECT,
      }),
      this.prisma.post.count({ where: { communityId: community.id } }),
    ]);
    return toPage(data, total, query);
  }

  private async getCommunityOrThrow(slug: string): Promise<Community> {
    const community = await this.prisma.community.findUnique({
      where: { slug },
    });
    if (!community) {
      throw new NotFoundException(`Community "${slug}" not found`);
    }
    return community;
  }

  // membro ativo (não banido); 404 se não existir ou estiver banido
  private async getActiveMembership(
    communityId: number,
    userId: number,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<Membership> {
    const membership = await db.membership.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    if (!membership || membership.bannedAt) {
      throw new NotFoundException('Member not found');
    }
    return membership;
  }

  // escrita condicionada ao estado que acabou de ser checado: sob READ COMMITTED o UPDATE/DELETE
  // reavalia o WHERE contra a versão mais nova da linha, então se outra requisição mudou o membro
  // no meio do caminho nada é escrito e a operação dá 409
  private async writeOrConflict(write: Promise<{ count: number }>) {
    const { count } = await write;
    if (count !== 1) {
      throw new ConflictException(
        'The membership changed meanwhile; refresh and try again',
      );
    }
  }

  private present(
    community: Pick<Community, 'slug' | 'name' | 'description'>,
    memberCount: number | undefined,
    myRole: CommunityRole | null,
  ) {
    return {
      slug: community.slug,
      name: community.name,
      description: community.description,
      ...(memberCount !== undefined ? { memberCount } : {}),
      myRole,
    };
  }
}

// P2002 (unique) de uma corrida check-then-insert vira o mesmo 409 da checagem
function conflictOnUnique(conflict: ConflictException) {
  return (error: unknown): never => {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw conflict;
    }
    throw error;
  };
}
