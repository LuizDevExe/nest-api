import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    JwtModule.register({
      global: true,
      secret: process.env.SECRET_KEY || '',
      signOptions: { expiresIn: '43200s'},
    }),
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports:[AuthGuard, AuthService]
})
export class AuthModule {}
