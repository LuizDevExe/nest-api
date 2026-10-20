import { loadEnv } from './env';

describe('loadEnv', () => {
  const original = { ...process.env };
  const strongSecret = 'x'.repeat(32);

  beforeEach(() => {
    // sem .env no teste: só vale o que o próprio teste define
    jest.spyOn(process, 'loadEnvFile').mockImplementation(() => {
      throw new Error('no .env');
    });
  });

  afterEach(() => {
    process.env = { ...original };
    jest.restoreAllMocks();
  });

  it('aceita o ambiente completo', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/forum';
    process.env.SECRET_KEY = strongSecret;
    expect(() => loadEnv()).not.toThrow();
  });

  it('lista as variáveis que faltam', () => {
    delete process.env.DATABASE_URL;
    delete process.env.SECRET_KEY;
    expect(() => loadEnv()).toThrow(
      'Missing environment variables: DATABASE_URL, SECRET_KEY',
    );
  });

  it('recusa chave de JWT curta', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/forum';
    process.env.SECRET_KEY = 'curta';
    expect(() => loadEnv()).toThrow('SECRET_KEY must be at least 32');
  });
});
