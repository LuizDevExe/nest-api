import { User } from 'src/user/entities/user.entity';
import { Answer } from 'src/answers/entities/answer.entity';

export class Post {
  id: number;
  title: string;
  content?: string | null;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;

  User: User;
  answers?: Answer[];
}
