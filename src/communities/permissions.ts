import { CommunityRole } from '@prisma/client';

export type CommunityAction =
  | 'post'
  | 'moderate'
  | 'ban'
  | 'edit'
  | 'changeRole'
  | 'transfer'
  | 'delete'
  | 'leave';

const RANKS: Record<CommunityRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MODERATOR: 1,
  MEMBER: 0,
};

export function rank(role: CommunityRole): number {
  return RANKS[role];
}

export function can(
  actor: CommunityRole | null,
  action: CommunityAction,
  target?: { role: CommunityRole; newRole?: CommunityRole },
): boolean {
  if (actor === null) return false;

  switch (action) {
    case 'post':
      return true;
    case 'moderate':
      return rank(actor) >= rank('MODERATOR');
    case 'ban':
      return (
        rank(actor) >= rank('MODERATOR') &&
        !!target &&
        rank(actor) > rank(target.role)
      );
    case 'edit':
      return rank(actor) >= rank('ADMIN');
    case 'changeRole':
      return (
        rank(actor) >= rank('ADMIN') &&
        !!target &&
        target.newRole !== undefined &&
        rank(actor) > rank(target.role) &&
        rank(actor) > rank(target.newRole)
      );
    case 'transfer':
      return rank(actor) >= rank('OWNER');
    case 'delete':
      return rank(actor) >= rank('OWNER');
    case 'leave':
      return rank(actor) < rank('OWNER');
  }
}
