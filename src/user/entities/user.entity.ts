import { Post } from 'src/post/entities/post.entity';
import { Answer } from 'src/answers/entities/answer.entity';

export class User {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;

  posts?: Post[];
  answers?: Answer[];
}
