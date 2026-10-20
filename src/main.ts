import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadEnv } from './config/env';
import { configureApp } from './app.setup';

async function bootstrap() {
  loadEnv();
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const config = new DocumentBuilder()
    .setTitle('Fórum Simples com Nest.js')
    .setDescription(
      'Uma Api que simula as funções básicas de um fórum (singUp, signIn, Post e answers)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Fórum')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
