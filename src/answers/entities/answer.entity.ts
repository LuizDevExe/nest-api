import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';
import { Answers as PrismaAnwsers } from '@prisma/client';


export class Answer implements PrismaAnwsers{
  authorId: number;
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  postId: number;


  user: User;
  post?: Post;
}
