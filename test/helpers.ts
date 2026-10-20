import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/database/prisma.service';

export const PASSWORD = 'SenhaForte123!';

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

export async function resetDatabase(app: INestApplication): Promise<void> {
  await app
    .get(PrismaService)
    .$executeRawUnsafe(
      'TRUNCATE "Answers", "Post", "User" RESTART IDENTITY CASCADE',
    );
}

// cria um usuário e devolve o id e o header de autorização dele
export async function signUpAndSignIn(
  app: INestApplication<App>,
  email: string,
  name = 'Maria Silva',
): Promise<{ id: number; auth: { Authorization: string } }> {
  const created = await request(app.getHttpServer())
    .post('/user')
    .send({ email, name, password: PASSWORD })
    .expect(201);
  const signedIn = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ email, password: PASSWORD })
    .expect(200);
  return {
    id: (created.body as { id: number }).id,
    auth: {
      Authorization: `Bearer ${(signedIn.body as { access_token: string }).access_token}`,
    },
  };
}
