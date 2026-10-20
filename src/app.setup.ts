import { INestApplication, ValidationPipe } from '@nestjs/common';

// A configuração do app que vale tanto para a API quanto para os testes e2e.
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe());
}
