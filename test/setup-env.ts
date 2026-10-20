// Os testes e2e rodam contra um banco próprio (forum_test), nunca o de desenvolvimento.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://forum:forum@localhost:5432/forum_test?schema=public';

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.SECRET_KEY = 'e2e-secret-key-with-at-least-32-characters';
