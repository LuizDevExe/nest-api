# Nest Forum API

[![CI](https://github.com/LuizDevExe/nest-api/actions/workflows/ci.yml/badge.svg)](https://github.com/LuizDevExe/nest-api/actions/workflows/ci.yml)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

API REST de um fórum: usuários, posts e respostas, com login por JWT. Feita em **NestJS** com **Prisma** e **PostgreSQL**, documentada no **Swagger**, testada de ponta a ponta contra um banco de verdade e com CI no GitHub Actions.

## Rodando

Pré-requisitos: Node.js 20.12 ou mais novo e Docker.

```bash
cp .env.example .env
# preencha SECRET_KEY com uma chave de no mínimo 32 caracteres:
#   openssl rand -base64 48
docker compose up -d db        # Postgres na porta 5432
npm ci
npx prisma migrate deploy      # cria as tabelas
npm run start:dev              # API em http://localhost:3000
```

A documentação interativa fica em **http://localhost:3000/api**. Para as rotas protegidas, faça login em `POST /auth/signin`, clique em **Authorize** e cole o token.

Tudo dentro do Docker (banco e API, com as migrações aplicadas na subida):

```bash
docker compose --profile app up --build   # API em http://localhost:3000 (mude com API_PORT)
```

A API **não sobe** sem `DATABASE_URL` e `SECRET_KEY`, nem com uma chave curta: melhor falhar na subida do que assinar tokens com uma chave fraca.

## Testes

```bash
npm test            # unidade
npm run test:e2e    # ponta a ponta, contra o Postgres do docker compose
```

Os testes e2e sobem a aplicação inteira e falam com ela por HTTP, num banco separado (`forum_test`, criado e migrado sozinho; as tabelas são zeradas entre os testes). Eles cobrem:

- cadastro, senha fraca, e-mail repetido e login;
- o login responde igual para e-mail desconhecido e senha errada;
- token ausente ou assinado com outra chave;
- **ninguém edita ou apaga a conta, o post ou a resposta de outra pessoa** (403);
- campos que não existem no DTO são recusados (não dá para trocar o dono de um post mandando `userId`);
- 404 para post e resposta que não existem;
- apagar um post leva as respostas junto;
- paginação da listagem de posts.

O CI roda lint, testes de unidade, build e e2e (com um Postgres de serviço) a cada push e PR, e compila a imagem Docker.

## Regras de acesso

| Ação | Quem pode |
| --- | --- |
| Criar conta, fazer login | qualquer pessoa |
| Ver usuários, posts e respostas | quem está logado |
| Criar post ou resposta | quem está logado (vira o autor) |
| Editar ou apagar post / resposta | só o autor |
| Editar ou apagar a conta | só o dono da conta |

## Endpoints

| Método | Rota | O que faz |
| --- | --- | --- |
| `POST` | `/user` | Cria um usuário |
| `GET` | `/user/:id` | Busca um usuário (sem a senha) |
| `PATCH` | `/user/:id` | Atualiza a própria conta |
| `DELETE` | `/user/:id` | Apaga a própria conta, com os posts e as respostas |
| `POST` | `/auth/signin` | Login; devolve o `access_token` (JWT, 12 h) |
| `POST` | `/post` | Cria um post |
| `GET` | `/post?page=1&limit=10` | Lista os posts, do mais novo para o mais antigo (máximo 50 por página) |
| `GET` | `/post/:id` | Busca um post |
| `PATCH` | `/post/:id` | Edita o próprio post |
| `DELETE` | `/post/:id` | Apaga o próprio post e as respostas dele |
| `POST` | `/answers/:postId` | Responde a um post |
| `GET` | `/answers` | Lista as respostas |
| `GET` | `/answers/:id` | Busca uma resposta |
| `PATCH` | `/answers/:id` | Edita a própria resposta |
| `DELETE` | `/answers/:id` | Apaga a própria resposta |

A listagem de posts responde `{ data, meta: { page, limit, total, totalPages } }`.

## Decisões

- **Testes e2e em vez de mocks.** As regras que importam aqui (quem pode o quê, o que vai para o banco) moram na integração entre guard, validação, serviço e Prisma. Mockar o Prisma esconderia exatamente os erros que esses testes pegam.
- **Dono conferido no serviço.** `assertOwner` (`src/auth/ownership.ts`) responde 404 quando o registro não existe e 403 quando é de outra pessoa; o id do usuário logado chega pelo decorator `@CurrentUserId()`.
- **Validação estrita.** O `ValidationPipe` global usa `whitelist` e `forbidNonWhitelisted`: só passa o que o DTO declara, e campo a mais é 400.
- **Login sem vazamento.** E-mail desconhecido e senha errada devolvem o mesmo 401, e o e-mail desconhecido também passa por um `bcrypt.compare` (contra um hash qualquer), para o tempo de resposta não denunciar quem tem conta.
- **Configuração conferida na subida** (`src/config/env.ts`), com o `.env` lido pelo próprio Node (`process.loadEnvFile`), sem dependência extra.
- **Apagar conta em uma transação**: o usuário, os posts e as respostas saem juntos ou nada sai.

## Estrutura

```
src/
├─ auth/       login, guard JWT, @CurrentUserId, assertOwner
├─ user/       cadastro e conta
├─ post/       posts (com paginação)
├─ answers/    respostas
├─ common/     paginação
├─ config/     variáveis de ambiente
├─ database/   PrismaService
├─ app.setup.ts  configuração compartilhada pela API e pelos testes
└─ main.ts
prisma/        schema e migrações
test/          testes e2e e o setup do banco de teste
```

## Comandos

```bash
npm run start:dev     # API com reload
npm run lint:check    # lint sem corrigir (o mesmo do CI)
npx prisma studio     # navegar nos dados
```
