import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './database/prisma.service';
import { DatabaseModule } from './database/database.module';
import { PostModule } from './post/post.module';
import { AnswersModule } from './answers/answers.module';
import { CommunitiesModule } from './communities/communities.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    DatabaseModule,
    PostModule,
    AnswersModule,
    CommunitiesModule,
  ],
  controllers: [],
  providers: [AuthService, PrismaService],
})
export class AppModule {}
