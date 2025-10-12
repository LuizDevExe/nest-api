# Nest.js Forum API

API REST desenvolvida em **NestJS** que simula o funcionamento de um fórum. O projeto utiliza o **Prisma** como ORM e documentação interativa via **Swagger**.

Esta API foi criada com o propósito de estudar a documentação oficial do NestJS e aplicar na prática os principais conceitos do framework, como arquitetura modular, injeção de dependências e integração com banco de dados via Prisma.

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)


## 🧩 Tecnologias utilizadas
- [NestJS](https://nestjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/)
- [Swagger](https://swagger.io/)
- [JWT](https://www.jwt.io/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [class-validator](https://github.com/typestack/class-validator)
- [PostgreSQL / SQLite] (ou outro banco que você quiser utilizar)
---

## ⚡ Pré-requisitos

Antes de rodar a aplicação, você precisa ter instalado:

- Node.js >= 18
- npm
- Banco de dados (PostgreSQL, MySQL ou SQLite)
---

## ⚙️ Configuração do projeto

1. Clone o repositório:

``` bash
git clone <URL_DO_REPOSITORIO>
cd nome-do-projeto
```

2. Instale as dependências:

```bash
npm install
```

3. Configure o arquivo .env na raiz do projeto. Exemplo de variáveis necessárias:

- Se for utilizar PostgreSQL: 

```bash
# Ajuste o schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}
````

```bash
# Ajuste o .env

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
SECRET_KEY="sua_chave_secreta"
```

ou você pode criar um banco local com SQLite

```bash
# Ajuste o schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

```

```bash
# Ajuste o .env

DATABASE_URL="file:./forum.db"
SECRET_KEY="sua_chave_secreta"
```



## 🛠️ Prisma

1. Gere o client do Prisma

```bash
npx prisma generate
```

2. Rode as migrações

Caso seja a primeira vez que você roda o projeto:

```bash
npx prisma migrate dev --name init
```
Isso cria o banco de dados e aplica o schema definido no prisma/schema.prisma.

3. Comando para inspecionar o banco

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

Essa rota é a responsável por criar um token JWT que será utilizado tanto para autenticação quanto para vincular o user na aos Posts e Answers durante a criação dos mesmos.


## 🔒 Autenticação

Para acessar rotas protegidas:

Faça login via /auth/signin

Copie o token retornado

No Swagger, clique em "Authorize" e cole o token no formato:
``` bash
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
```bash
npm run start:dev       # Roda servidor em modo dev
npx prisma migrate dev   # Aplica migrações
npx prisma studio        # Abre Prisma Studio
```
