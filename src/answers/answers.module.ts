import { Module } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { PrismaService } from 'src/database/prisma.service';
import { CommunitiesModule } from 'src/communities/communities.module';

@Module({
  imports: [CommunitiesModule],
  controllers: [AnswersController],
  providers: [AnswersService, PrismaService],
})
export class AnswersModule {}
