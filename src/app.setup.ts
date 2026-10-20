import { INestApplication, ValidationPipe } from '@nestjs/common';

// A configuração do app que vale tanto para a API quanto para os testes e2e.
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // só os campos declarados nos DTOs chegam aos serviços
      forbidNonWhitelisted: true, // e campo a mais vira 400 (ex.: tentar trocar o userId de um post)
      transform: true,
    }),
  );
}
