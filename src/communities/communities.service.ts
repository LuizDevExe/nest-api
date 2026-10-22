import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Community, CommunityRole, Membership } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationQueryDto, toPage } from 'src/common/pagination';
import { AUTHOR } from 'src/common/author';
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
  ): Promise<CommunityRole | null> {
    const membership = await this.prisma.membership.findUnique({
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

    const community = await this.prisma.$transaction(async (tx) => {
      const created = await tx.community.create({ data: dto });
      await tx.membership.create({
        data: { userId, communityId: created.id, role: 'OWNER' },
      });
      return created;
    });

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

    await this.prisma.membership.create({
      data: { userId, communityId: community.id, role: 'MEMBER' },
    });
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

    await this.prisma.membership.delete({
      where: { userId_communityId: { userId, communityId: community.id } },
    });
    return { slug: community.slug };
  }

  async changeRole(
    slug: string,
    targetUserId: number,
    newRole: CommunityRole,
    actorUserId: number,
  ) {
    const community = await this.getCommunityOrThrow(slug);
    const actorRole = await this.roleOf(community.id, actorUserId);
    const target = await this.getActiveMembership(community.id, targetUserId);

    if (!can(actorRole, 'changeRole', { role: target.role, newRole })) {
      throw new ForbiddenException();
    }

    const updated = await this.prisma.membership.update({
      where: {
        userId_communityId: { userId: targetUserId, communityId: community.id },
      },
      data: { role: newRole },
    });
    return { userId: targetUserId, role: updated.role };
  }

  async ban(slug: string, targetUserId: number, actorUserId: number) {
    const community = await this.getCommunityOrThrow(slug);
    const actorRole = await this.roleOf(community.id, actorUserId);
    const target = await this.getActiveMembership(community.id, targetUserId);

    if (!can(actorRole, 'ban', { role: target.role })) {
      throw new ForbiddenException();
    }

    // bane e rebaixa para MEMBER
    const updated = await this.prisma.membership.update({
      where: {
        userId_communityId: { userId: targetUserId, communityId: community.id },
      },
      data: { role: 'MEMBER', bannedAt: new Date() },
    });
    return { userId: targetUserId, bannedAt: updated.bannedAt };
  }

  async transfer(slug: string, targetUserId: number, actorUserId: number) {
    const community = await this.getCommunityOrThrow(slug);
    const actorRole = await this.roleOf(community.id, actorUserId);

    // mesma ordem de changeRole/ban: existência do alvo antes da permissão,
    // senão um não-dono transferindo para alvo inexistente/banido levaria 403 em vez do 404 uniforme
    await this.getActiveMembership(community.id, targetUserId);

    if (!can(actorRole, 'transfer')) throw new ForbiddenException();

    await this.prisma.$transaction([
      this.prisma.membership.update({
        where: {
          userId_communityId: {
            userId: actorUserId,
            communityId: community.id,
          },
        },
        data: { role: 'ADMIN' },
      }),
      this.prisma.membership.update({
        where: {
          userId_communityId: {
            userId: targetUserId,
            communityId: community.id,
          },
        },
        data: { role: 'OWNER' },
      }),
    ]);
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
  ): Promise<Membership> {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    if (!membership || membership.bannedAt) {
      throw new NotFoundException('Member not found');
    }
    return membership;
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
