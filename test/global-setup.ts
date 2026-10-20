import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './setup-env';

// Aplica as migrações no banco de teste (cria o banco se faltar); os testes zeram as tabelas.
export default function globalSetup(): void {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'ignore',
  });
}
