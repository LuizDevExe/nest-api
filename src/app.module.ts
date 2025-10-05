import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './database/prisma.service';
import { DatabaseModule } from './database/database.module';


@Module({
  imports: [UserModule, AuthModule, DatabaseModule],
  controllers: [],
  providers: [AuthService, PrismaService],
})
export class AppModule {}
