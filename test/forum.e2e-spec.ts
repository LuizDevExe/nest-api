import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  PASSWORD,
  createTestApp,
  resetDatabase,
  signUpAndSignIn,
} from './helpers';

type Auth = { id: number; auth: { Authorization: string } };

describe('Fórum (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let maria: Auth;
  let joao: Auth;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  beforeEach(async () => {
    await resetDatabase(app);
    maria = await signUpAndSignIn(app, 'maria@email.com');
    joao = await signUpAndSignIn(app, 'joao@email.com', 'João Souza');
  });

  afterAll(async () => {
    await app.close();
  });

  const createPost = (
    who: Auth,
    body = { title: 'Primeiro post', content: 'Olá, fórum' },
  ) => http.post('/post').set(who.auth).send(body);

  describe('cadastro e login', () => {
    it('cria o usuário sem devolver a senha', async () => {
      const res = await http
        .post('/user')
        .send({ email: 'ana@email.com', name: 'Ana', password: PASSWORD })
        .expect(201);
      expect(res.body).toMatchObject({ email: 'ana@email.com', name: 'Ana' });
      expect(res.body).not.toHaveProperty('password');
    });

    it('recusa e-mail repetido com 409', () =>
      http
        .post('/user')
        .send({ email: 'maria@email.com', name: 'Outra', password: PASSWORD })
        .expect(409));

    it('recusa senha fraca com 400', () =>
      http
        .post('/user')
        .send({ email: 'ana@email.com', name: 'Ana', password: '123' })
        .expect(400));

    it('responde igual para senha errada e e-mail desconhecido (não revela quem tem conta)', async () => {
      const senhaErrada = await http
        .post('/auth/signin')
        .send({ email: 'maria@email.com', password: 'Errada123!xyz' })
        .expect(401);
      const emailDesconhecido = await http
        .post('/auth/signin')
        .send({ email: 'ninguem@email.com', password: 'Errada123!xyz' })
        .expect(401);
      expect(emailDesconhecido.body).toEqual(senhaErrada.body);
    });

    it('valida o corpo do login com 400', () =>
      http.post('/auth/signin').send({ email: 'não é e-mail' }).expect(400));

    it('exige token nas rotas protegidas', () => http.get('/post').expect(401));

    it('recusa token assinado com outra chave', () =>
      http
        .get('/post')
        .set(
          'Authorization',
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.c2lnbmF0dXJhLWZhbHNh',
        )
        .expect(401));
  });

  describe('usuários', () => {
    it('busca um usuário sem a senha', async () => {
      const res = await http
        .get(`/user/${maria.id}`)
        .set(maria.auth)
        .expect(200);
      expect(res.body).not.toHaveProperty('password');
    });

    it('deixa o usuário editar a própria conta', async () => {
      const res = await http
        .patch(`/user/${maria.id}`)
        .set(maria.auth)
        .send({ name: 'Maria Souza' })
        .expect(200);
      expect(res.body.name).toBe('Maria Souza');
    });

    it('não deixa editar a conta de outra pessoa', () =>
      http
        .patch(`/user/${maria.id}`)
        .set(joao.auth)
        .send({ name: 'Invasor' })
        .expect(403));

    it('não deixa apagar a conta de outra pessoa', () =>
      http.delete(`/user/${maria.id}`).set(joao.auth).expect(403));

    it('devolve o usuário logado em /user/me', async () => {
      const res = await http.get('/user/me').set(maria.auth).expect(200);
      expect(res.body).toMatchObject({ name: 'Maria Silva' });
    });

    it('exige token em /user/me', () => http.get('/user/me').expect(401));
  });

  describe('posts', () => {
    it('cria um post com o autor logado', async () => {
      const res = await createPost(maria).expect(201);
      expect(res.body).toMatchObject({
        title: 'Primeiro post',
        user: { name: 'Maria Silva' },
      });
    });

    it('lista o autor com id e name, sem o e-mail', async () => {
      await createPost(maria).expect(201);
      const res = await http.get('/post').set(maria.auth).expect(200);
      expect(res.body.data[0].user).toEqual({
        id: maria.id,
        name: 'Maria Silva',
      });
    });

    it('lista os posts paginados, do mais novo para o mais antigo', async () => {
      for (let i = 1; i <= 3; i++) {
        await createPost(maria, {
          title: `Post ${i}`,
          content: 'Texto',
        }).expect(201);
      }
      const res = await http
        .get('/post?page=2&limit=2')
        .set(maria.auth)
        .expect(200);
      expect(res.body.meta).toEqual({
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
      expect(res.body.data.map((p: { title: string }) => p.title)).toEqual([
        'Post 1',
      ]);
    });

    it('recusa paginação inválida com 400', async () => {
      await http.get('/post?limit=500').set(maria.auth).expect(400);
      await http.get('/post?page=0').set(maria.auth).expect(400);
    });

    it('devolve 404 para post que não existe', () =>
      http.get('/post/999').set(maria.auth).expect(404));

    it('não deixa editar o post de outra pessoa', async () => {
      const post = await createPost(maria).expect(201);
      await http
        .patch(`/post/${post.body.id}`)
        .set(joao.auth)
        .send({ title: 'Editado' })
        .expect(403);
    });

    it('recusa campos que não são do post (não dá para trocar o dono)', async () => {
      const post = await createPost(maria).expect(201);
      await http
        .patch(`/post/${post.body.id}`)
        .set(maria.auth)
        .send({ userId: joao.id })
        .expect(400);
    });

    it('não deixa apagar o post de outra pessoa', async () => {
      const post = await createPost(maria).expect(201);
      await http.delete(`/post/${post.body.id}`).set(joao.auth).expect(403);
    });

    it('apaga o próprio post junto com as respostas', async () => {
      const post = await createPost(maria).expect(201);
      const answer = await http
        .post(`/answers/${post.body.id}`)
        .set(joao.auth)
        .send({ content: 'Boa!' })
        .expect(201);
      await http.delete(`/post/${post.body.id}`).set(maria.auth).expect(200);
      await http.get(`/answers/${answer.body.id}`).set(maria.auth).expect(404);
    });
  });

  describe('respostas', () => {
    it('responde a um post', async () => {
      const post = await createPost(maria).expect(201);
      const res = await http
        .post(`/answers/${post.body.id}`)
        .set(joao.auth)
        .send({ content: 'Bem-vinda!' })
        .expect(201);
      expect(res.body).toMatchObject({
        content: 'Bem-vinda!',
        postId: post.body.id,
      });
    });

    it('devolve 404 ao responder post que não existe', () =>
      http
        .post('/answers/999')
        .set(joao.auth)
        .send({ content: 'Oi' })
        .expect(404));

    it('não deixa editar nem apagar a resposta de outra pessoa', async () => {
      const post = await createPost(maria).expect(201);
      const answer = await http
        .post(`/answers/${post.body.id}`)
        .set(joao.auth)
        .send({ content: 'Minha resposta' })
        .expect(201);
      await http
        .patch(`/answers/${answer.body.id}`)
        .set(maria.auth)
        .send({ content: 'Editada' })
        .expect(403);
      await http
        .delete(`/answers/${answer.body.id}`)
        .set(maria.auth)
        .expect(403);
    });
  });
});
