import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [UserModule, AuthModule],
  controllers: [],
  providers: [AuthService],
})
export class AppModule {}
