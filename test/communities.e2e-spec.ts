import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, resetDatabase, signUpAndSignIn } from './helpers';

type Auth = { id: number; auth: { Authorization: string } };

describe('Comunidades (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let maria: Auth;
  let joao: Auth;
  let ana: Auth;
  let bia: Auth;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  beforeEach(async () => {
    await resetDatabase(app);
    maria = await signUpAndSignIn(app, 'maria@email.com', 'Maria Silva');
    joao = await signUpAndSignIn(app, 'joao@email.com', 'João Souza');
    ana = await signUpAndSignIn(app, 'ana@email.com', 'Ana Paula');
    bia = await signUpAndSignIn(app, 'bia@email.com', 'Bia Costa');
  });

  afterAll(async () => {
    await app.close();
  });

  const createCommunity = (
    who: Auth,
    body: { slug: string; name: string; description?: string } = {
      slug: 'nest-br',
      name: 'Nest BR',
      description: 'Comunidade',
    },
  ) => http.post('/communities').set(who.auth).send(body);

  const join = (slug: string, who: Auth) =>
    http.post(`/communities/${slug}/members`).set(who.auth).send();

  const changeRole = (slug: string, who: Auth, target: Auth, role: string) =>
    http
      .patch(`/communities/${slug}/members/${target.id}`)
      .set(who.auth)
      .send({ role });

  const ban = (slug: string, who: Auth, target: Auth) =>
    http.post(`/communities/${slug}/bans`).set(who.auth).send({
      userId: target.id,
    });

  const createPost = (
    who: Auth,
    communitySlug?: string,
    body: { title: string; content: string } = {
      title: 'Post da comunidade',
      content: 'Conteúdo',
    },
  ) =>
    http
      .post('/post')
      .set(who.auth)
      .send(communitySlug ? { ...body, communitySlug } : body);

  describe('criar comunidade', () => {
    it('cria com o criador como OWNER', async () => {
      const res = await createCommunity(maria).expect(201);
      expect(res.body).toMatchObject({
        slug: 'nest-br',
        name: 'Nest BR',
        memberCount: 1,
        myRole: 'OWNER',
      });
    });

    it('recusa slug repetido com 409', async () => {
      await createCommunity(maria).expect(201);
      await createCommunity(joao).expect(409);
    });

    it('recusa slug maiúsculo com 400 (não converte)', () =>
      createCommunity(maria, { slug: 'Nest BR', name: 'Nest BR' }).expect(400));

    it('recusa nome maior que 40 e descrição maior que 255', async () => {
      await createCommunity(maria, {
        slug: 'nest-br',
        name: 'x'.repeat(41),
      }).expect(400);
      await createCommunity(maria, {
        slug: 'nest-br2',
        name: 'Nest BR',
        description: 'x'.repeat(256),
      }).expect(400);
    });
  });

  describe('entrar e sair', () => {
    beforeEach(() => createCommunity(maria).expect(201));

    it('João entra e vira membro', async () => {
      const res = await join('nest-br', joao).expect(201);
      expect(res.body).toMatchObject({ memberCount: 2, myRole: 'MEMBER' });
    });

    it('entrar de novo dá 409', async () => {
      await join('nest-br', joao).expect(201);
      await join('nest-br', joao).expect(409);
    });

    it('dono tenta sair dá 409', () =>
      http
        .delete('/communities/nest-br/members/me')
        .set(maria.auth)
        .expect(409));
  });

  describe('cargos e banimento', () => {
    beforeEach(async () => {
      await createCommunity(maria).expect(201);
      await join('nest-br', joao).expect(201);
      await join('nest-br', ana).expect(201);
      await join('nest-br', bia).expect(201);
    });

    it('Maria promove João a ADMIN', () =>
      changeRole('nest-br', maria, joao, 'ADMIN').expect(200));

    it('João (admin) tenta promover Ana a ADMIN dá 403 (só o dono cria admins)', async () => {
      await changeRole('nest-br', maria, joao, 'ADMIN').expect(200);
      await changeRole('nest-br', joao, ana, 'ADMIN').expect(403);
    });

    it('João (admin) promove Ana a MODERATOR', async () => {
      await changeRole('nest-br', maria, joao, 'ADMIN').expect(200);
      await changeRole('nest-br', joao, ana, 'MODERATOR').expect(200);
    });

    it('mudar cargo para OWNER nunca é permitido via PATCH', () =>
      changeRole('nest-br', maria, joao, 'OWNER').expect(403));

    it('Ana (moderadora) bane Bia (membro)', async () => {
      await changeRole('nest-br', maria, joao, 'ADMIN').expect(200);
      await changeRole('nest-br', joao, ana, 'MODERATOR').expect(200);
      await ban('nest-br', ana, bia).expect(200);
    });

    it('Bia banida tenta entrar de novo dá 403', async () => {
      await changeRole('nest-br', maria, joao, 'ADMIN').expect(200);
      await changeRole('nest-br', joao, ana, 'MODERATOR').expect(200);
      await ban('nest-br', ana, bia).expect(200);
      await join('nest-br', bia).expect(403);
    });

    it('Ana (moderadora) tenta banir João (admin) dá 403', async () => {
      await changeRole('nest-br', maria, joao, 'ADMIN').expect(200);
      await changeRole('nest-br', joao, ana, 'MODERATOR').expect(200);
      await ban('nest-br', ana, joao).expect(403);
    });

    it('banir demove o alvo para MEMBER', async () => {
      await changeRole('nest-br', maria, joao, 'ADMIN').expect(200);
      await changeRole('nest-br', joao, ana, 'MODERATOR').expect(200);
      await ban('nest-br', ana, bia).expect(200);
      // Bia agora é MEMBER banido: um moderador não consegue mudar o cargo dela (está banida = 404)
      await changeRole('nest-br', ana, bia, 'MODERATOR').expect(404);
    });

    it('banir/mudar cargo/transferir para quem não é membro ativo dá 404', async () => {
      const carlos = await signUpAndSignIn(app, 'carlos@email.com', 'Carlos');
      await ban('nest-br', maria, carlos).expect(404);
      await changeRole('nest-br', maria, carlos, 'ADMIN').expect(404);
      await http
        .post('/communities/nest-br/transfer')
        .set(maria.auth)
        .send({ userId: carlos.id })
        .expect(404);
    });

    it('transferir com ator sem permissão e alvo inexistente/banido dá 404, não 403', async () => {
      const carlos = await signUpAndSignIn(app, 'carlos@email.com', 'Carlos');
      // João é só MEMBER (sem permissão de transfer) e o alvo nem existe como membro: 404 deve vencer o 403
      await http
        .post('/communities/nest-br/transfer')
        .set(joao.auth)
        .send({ userId: carlos.id })
        .expect(404);

      // idem com um alvo banido
      await ban('nest-br', maria, bia).expect(200);
      await http
        .post('/communities/nest-br/transfer')
        .set(joao.auth)
        .send({ userId: bia.id })
        .expect(404);
    });
  });

  describe('editar e apagar comunidade', () => {
    beforeEach(async () => {
      await createCommunity(maria).expect(201);
      await join('nest-br', joao).expect(201);
      await join('nest-br', ana).expect(201);
      await changeRole('nest-br', maria, joao, 'ADMIN').expect(200);
    });

    it('João (admin) edita o nome', async () => {
      const res = await http
        .patch('/communities/nest-br')
        .set(joao.auth)
        .send({ name: 'Nest Brasil' })
        .expect(200);
      expect(res.body.name).toBe('Nest Brasil');
    });

    it('Ana (membro) tenta editar dá 403', () =>
      http
        .patch('/communities/nest-br')
        .set(ana.auth)
        .send({ name: 'Invasão' })
        .expect(403));

    it('Maria transfere a posse para João', async () => {
      const res = await http
        .post('/communities/nest-br/transfer')
        .set(maria.auth)
        .send({ userId: joao.id })
        .expect(200);
      expect(res.body).toBeTruthy();

      const mariaView = await http
        .get('/communities/nest-br')
        .set(maria.auth)
        .expect(200);
      expect(mariaView.body.myRole).toBe('ADMIN');

      const joaoView = await http
        .get('/communities/nest-br')
        .set(joao.auth)
        .expect(200);
      expect(joaoView.body.myRole).toBe('OWNER');
    });

    it('João (agora dono, depois da transferência) apaga a comunidade', async () => {
      await http
        .post('/communities/nest-br/transfer')
        .set(maria.auth)
        .send({ userId: joao.id })
        .expect(200);
      await http.delete('/communities/nest-br').set(joao.auth).expect(200);
      await http.get('/communities/nest-br').set(joao.auth).expect(404);
    });
  });

  describe('listagem, mine e banned', () => {
    beforeEach(async () => {
      await createCommunity(maria).expect(201);
      await createCommunity(joao, {
        slug: 'outra',
        name: 'Outra Comunidade',
      }).expect(201);
      await join('nest-br', ana).expect(201);
      await join('nest-br', bia).expect(201);
    });

    it('GET /communities lista todas, com memberCount e myRole do chamador', async () => {
      const res = await http.get('/communities').set(maria.auth).expect(200);
      const nestBr = res.body.data.find(
        (c: { slug: string }) => c.slug === 'nest-br',
      );
      expect(nestBr).toMatchObject({ memberCount: 3, myRole: 'OWNER' });
      const outra = res.body.data.find(
        (c: { slug: string }) => c.slug === 'outra',
      );
      expect(outra).toMatchObject({ memberCount: 1, myRole: null });
    });

    it('GET /communities?mine=true só devolve onde o chamador é membro ativo', async () => {
      const res = await http
        .get('/communities?mine=true')
        .set(ana.auth)
        .expect(200);
      expect(res.body.data.map((c: { slug: string }) => c.slug)).toEqual([
        'nest-br',
      ]);
    });

    it('GET /communities/:slug devolve banned:true depois do ban', async () => {
      await changeRole('nest-br', maria, ana, 'MODERATOR').expect(200);
      await ban('nest-br', ana, bia).expect(200);

      const res = await http
        .get('/communities/nest-br')
        .set(bia.auth)
        .expect(200);
      expect(res.body).toMatchObject({ banned: true, myRole: null });
    });

    it('memberCount só conta membros ativos (não banidos)', async () => {
      await changeRole('nest-br', maria, ana, 'MODERATOR').expect(200);
      await ban('nest-br', ana, bia).expect(200);

      const res = await http.get('/communities/nest-br').set(maria.auth);
      expect(res.body.memberCount).toBe(2);
    });
  });

  describe('GET /communities/:slug/members', () => {
    beforeEach(async () => {
      await createCommunity(maria).expect(201);
      await join('nest-br', joao).expect(201);
      await join('nest-br', ana).expect(201);
      await join('nest-br', bia).expect(201);
      await changeRole('nest-br', maria, joao, 'ADMIN').expect(200);
    });

    it('lista membros ativos ordenados por cargo desc e depois createdAt asc', async () => {
      const res = await http
        .get('/communities/nest-br/members')
        .set(bia.auth)
        .expect(200);
      expect(
        res.body.data.map((m: { user: { id: number }; role: string }) => [
          m.user.id,
          m.role,
        ]),
      ).toEqual([
        [maria.id, 'OWNER'],
        [joao.id, 'ADMIN'],
        [ana.id, 'MEMBER'],
        [bia.id, 'MEMBER'],
      ]);
    });

    it('membro banido some da lista', async () => {
      await ban('nest-br', joao, bia).expect(200);
      const res = await http
        .get('/communities/nest-br/members')
        .set(maria.auth)
        .expect(200);
      expect(
        res.body.data.some(
          (m: { user: { id: number } }) => m.user.id === bia.id,
        ),
      ).toBe(false);
    });
  });

  describe('apagar conta e comunidades', () => {
    it('dono de comunidade não pode apagar a própria conta', async () => {
      await createCommunity(maria).expect(201);
      await http.delete(`/user/${maria.id}`).set(maria.auth).expect(409);
    });

    it('quem não é dono de nenhuma comunidade apaga a conta normalmente', async () => {
      await createCommunity(maria).expect(201);
      await join('nest-br', joao).expect(201);
      await http.delete(`/user/${joao.id}`).set(joao.auth).expect(200);
    });
  });

  describe('posts e respostas em comunidades', () => {
    beforeEach(async () => {
      await createCommunity(maria).expect(201);
      await join('nest-br', joao).expect(201);
      await join('nest-br', ana).expect(201);
      // ana vira moderadora
      await changeRole('nest-br', maria, joao, 'ADMIN').expect(200);
      await changeRole('nest-br', joao, ana, 'MODERATOR').expect(200);
    });

    it('membro posta na comunidade: 201, aparece em GET /communities/:slug/posts e em GET /post com community.slug', async () => {
      const post = await createPost(joao, 'nest-br').expect(201);

      const porComunidade = await http
        .get('/communities/nest-br/posts')
        .set(joao.auth)
        .expect(200);
      expect(
        porComunidade.body.data.map((p: { id: number }) => p.id),
      ).toContain(post.body.id);

      const feed = await http.get('/post').set(joao.auth).expect(200);
      const noFeed = feed.body.data.find(
        (p: { id: number }) => p.id === post.body.id,
      );
      expect(noFeed.community).toEqual({ slug: 'nest-br', name: 'Nest BR' });
    });

    it('GET /post/:id também inclui community: { slug, name }', async () => {
      const post = await createPost(joao, 'nest-br').expect(201);
      const res = await http
        .get(`/post/${post.body.id}`)
        .set(joao.auth)
        .expect(200);
      expect(res.body.community).toEqual({ slug: 'nest-br', name: 'Nest BR' });
    });

    it('post sem comunidade continua funcionando, com community: null', async () => {
      const post = await createPost(bia).expect(201);

      const feed = await http.get('/post').set(bia.auth).expect(200);
      const noFeed = feed.body.data.find(
        (p: { id: number }) => p.id === post.body.id,
      );
      expect(noFeed.community).toBeNull();

      const res = await http
        .get(`/post/${post.body.id}`)
        .set(bia.auth)
        .expect(200);
      expect(res.body.community).toBeNull();
    });

    it('criar post com communitySlug inexistente dá 404', () =>
      createPost(joao, 'nao-existe').expect(404));

    it('não membro posta na comunidade dá 403', () =>
      createPost(bia, 'nest-br').expect(403));

    it('não membro responde a um post da comunidade dá 403', async () => {
      const post = await createPost(joao, 'nest-br').expect(201);
      await http
        .post(`/answers/${post.body.id}`)
        .set(bia.auth)
        .send({ content: 'Posso?' })
        .expect(403);
    });

    it('membro banido posta na comunidade dá 403', async () => {
      await join('nest-br', bia).expect(201);
      await ban('nest-br', ana, bia).expect(200);
      await createPost(bia, 'nest-br').expect(403);
    });

    it('moderadora apaga o post de um membro: 200', async () => {
      const post = await createPost(joao, 'nest-br').expect(201);
      await http.delete(`/post/${post.body.id}`).set(ana.auth).expect(200);
    });

    it('um membro apaga o post de outro membro dá 403 (regra do feed geral não muda)', async () => {
      await join('nest-br', bia).expect(201);
      const post = await createPost(joao, 'nest-br').expect(201);
      await http.delete(`/post/${post.body.id}`).set(bia.auth).expect(403);
    });

    it('moderadora apaga a resposta de um membro na comunidade: 200', async () => {
      const post = await createPost(joao, 'nest-br').expect(201);
      const answer = await http
        .post(`/answers/${post.body.id}`)
        .set(joao.auth)
        .send({ content: 'Resposta do João' })
        .expect(201);
      await http.delete(`/answers/${answer.body.id}`).set(ana.auth).expect(200);
    });

    it('apagar a comunidade apaga os posts e as respostas, e GET /post continua 200', async () => {
      const post = await createPost(joao, 'nest-br').expect(201);
      const answer = await http
        .post(`/answers/${post.body.id}`)
        .set(joao.auth)
        .send({ content: 'Resposta' })
        .expect(201);

      await http.delete('/communities/nest-br').set(maria.auth).expect(200);

      await http.get(`/post/${post.body.id}`).set(maria.auth).expect(404);
      await http.get(`/answers/${answer.body.id}`).set(maria.auth).expect(404);
      await http.get('/post').set(maria.auth).expect(200);
    });
  });
});
