import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => UserModule),
    // registerAsync: a chave é lida quando o módulo sobe, depois do loadEnv(), e não no import
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.SECRET_KEY,
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}
