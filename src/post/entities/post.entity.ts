import { User } from 'src/user/entities/user.entity';
import { Answer } from 'src/answers/entities/answer.entity';
import { Post as PrismaPost } from '@prisma/client';



export class Post implements PrismaPost{
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;

  User: User;
  answers?: Answer[];
}
