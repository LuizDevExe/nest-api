import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [CommunitiesController],
  providers: [CommunitiesService, PrismaService],
  exports: [CommunitiesService],
})
export class CommunitiesModule {}
