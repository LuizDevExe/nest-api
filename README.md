# NestJS + Prisma + Swagger API

API REST desenvolvida em **NestJS**, com **Prisma** como ORM e documentação interativa via **Swagger**.

## 🧩 Tecnologias utilizadas
- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [Swagger](https://swagger.io/)
- [PostgreSQL / MySQL] (ou outro banco que estiver usando)
---

## ⚡ Pré-requisitos

Antes de rodar a aplicação, você precisa ter instalado:

- Node.js >= 18
- npm ou yarn
- Banco de dados (PostgreSQL, MySQL ou SQLite)
- [Opcional] Docker e Docker Compose

---

## ⚙️ Configuração do projeto

1. Clone o repositório:

```
git clone <URL_DO_REPOSITORIO>
cd nome-do-projeto
```

2. Instale as dependências:

```
npm install
```

3. Configure o arquivo .env na raiz do projeto. Exemplo de variáveis necessárias:

```
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco?schema=public"
SECRET_KEY="sua_chave_secreta"
PORT=3000
```

ou você pode criar um banco local

```
DATABASE_URL="file:./forum.db"
SECRET_KEY="sua_chave_secreta"
```


## 🛠️ Prisma

1. Gerar client do Prisma

```
npx prisma generate
```

2. Rodar migrações

Caso seja a primeira vez que você roda o projeto:

```
npx prisma migrate dev --name init
```
Isso cria o banco de dados e aplica o schema definido no prisma/schema.prisma.

3. Inspecionar o banco

Você pode abrir o Prisma Studio para visualizar os dados:
```
npx prisma studio
```
## 🚀 Rodando a aplicação
```
npm run start:dev
```
Por padrão, a aplicação vai rodar em: http://localhost:3000

## 📑 Swagger

A documentação interativa está disponível em:

```
http://localhost:3000/api
```

No Swagger você pode:

Testar todas as rotas da API

Visualizar schemas de requisição e resposta

Testar autenticação usando Bearer Token nos endpoints protegidos

Para rotas protegidas, faça sign-in usando /auth/signin para gerar o token JWT e use-o no Swagger.

## 📝 Endpoints principais

Users

```
POST /user — Cria um usuário

GET /user/:id — Retorna um usuário pelo ID

PATCH /user/:id — Atualiza usuário

DELETE /user/:id — Deleta usuário
```

Posts
```
POST /post — Cria um post

GET /post — Lista todos os posts

GET /post/:id — Retorna um post pelo ID

PATCH /post/:id — Atualiza post

DELETE /post/:id — Deleta post
```

Answers
```
POST /answer — Cria uma resposta para um post

GET /answer — Lista todas as respostas

GET /answer/:id — Retorna uma resposta pelo ID

PATCH /answer/:id — Atualiza apenas o conteúdo da resposta

DELETE /answer/:id — Deleta uma resposta
```

Auth
```
POST /auth/signin — Login de usuário (retorna JWT)
```


## 🔒 Autenticação

Para acessar rotas protegidas:

Faça login via /auth/signin

Copie o token retornado

No Swagger, clique em "Authorize" e cole o token no formato:
```
Bearer <TOKEN>
```

## 💡 Dicas

Sempre rode npx prisma generate ao atualizar o schema do Prisma.

Use ValidationPipe globalmente no NestJS para validação de DTOs.

Para desenvolvimento, o Docker pode ser usado para subir o banco rapidamente.

## 📂 Estrutura do projeto

```
src/
 ├─ answer/
 ├─ auth/
 ├─ database/
 ├─ post/
 ├─ user/
 └─ main.ts
prisma/
 └─ schema.prisma
.env
package.json
```


## 🛠️ Comandos úteis
```
npm run start:dev       # Rodar servidor em modo dev
npx prisma migrate dev   # Aplicar migrações
npx prisma studio        # Abrir Prisma Studio
```
