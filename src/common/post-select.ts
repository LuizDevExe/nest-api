import { AUTHOR } from './author';

// comunidade exposta em todo post: { slug, name } para quem tem, null para quem não tem
export const COMMUNITY_SELECT = { select: { slug: true, name: true } } as const;

// usado por GET /post e GET /communities/:slug/posts (mesmo formato de item)
export const POST_LIST_SELECT = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  user: AUTHOR,
  community: COMMUNITY_SELECT,
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
