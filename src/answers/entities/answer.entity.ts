import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';

export class Answer {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  postId: number;


  user: User;
  post?: Post;
}
