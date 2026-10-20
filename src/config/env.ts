// Lê o .env (se houver) e confere as variáveis antes da API subir:
// sem banco ou sem uma chave de JWT forte, a API não deve aceitar nenhuma requisição.
const REQUIRED = ['DATABASE_URL', 'SECRET_KEY'] as const;
const MIN_SECRET_LENGTH = 32;

export function loadEnv(): void {
  try {
    process.loadEnvFile();
  } catch {
    // sem .env: vale o ambiente de verdade (Docker, CI, provedor)
  }

  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  if (process.env.SECRET_KEY!.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SECRET_KEY must be at least ${MIN_SECRET_LENGTH} characters long`,
    );
  }
}
