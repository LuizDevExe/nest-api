import { Post } from 'src/post/entities/post.entity';
import { Answer } from 'src/answers/entities/answer.entity';
import { User as PirsmaUser} from '@prisma/client';


export class User implements PirsmaUser {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;

  posts?: Post[];
  answers?: Answer[];
}
