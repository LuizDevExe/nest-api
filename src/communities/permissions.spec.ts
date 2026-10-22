import { CommunityRole } from '@prisma/client';
import { can, CommunityAction } from './permissions';

type Target = { role: CommunityRole; newRole?: CommunityRole };

describe('can', () => {
  it.each([
    [null, 'post', undefined, false],
    ['MEMBER', 'post', undefined, true],
    ['MEMBER', 'moderate', undefined, false],
    ['MODERATOR', 'moderate', undefined, true],
    ['MODERATOR', 'ban', { role: 'MEMBER' }, true],
    ['MODERATOR', 'ban', { role: 'MODERATOR' }, false],
    ['ADMIN', 'ban', { role: 'OWNER' }, false],
    ['ADMIN', 'edit', undefined, true],
    ['MODERATOR', 'edit', undefined, false],
    ['ADMIN', 'changeRole', { role: 'MEMBER', newRole: 'MODERATOR' }, true],
    ['ADMIN', 'changeRole', { role: 'MEMBER', newRole: 'ADMIN' }, false],
    ['ADMIN', 'changeRole', { role: 'ADMIN', newRole: 'MEMBER' }, false],
    ['OWNER', 'changeRole', { role: 'MEMBER', newRole: 'ADMIN' }, true],
    ['OWNER', 'changeRole', { role: 'MEMBER', newRole: 'OWNER' }, false],
    ['OWNER', 'transfer', undefined, true],
    ['ADMIN', 'transfer', undefined, false],
    ['OWNER', 'delete', undefined, true],
    ['ADMIN', 'delete', undefined, false],
    ['OWNER', 'leave', undefined, false],
    ['MEMBER', 'leave', undefined, true],
  ] as [CommunityRole | null, CommunityAction, Target | undefined, boolean][])(
    'can(%s, %s, %o) -> %s',
    (actor, action, target, expected) => {
      expect(can(actor, action, target)).toBe(expected);
    },
  );
});
