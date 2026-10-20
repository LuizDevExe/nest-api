import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUserId } from 'src/auth/current-user.decorator';
import { PaginationQueryDto } from 'src/common/pagination';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria um novo post',
    description: `Cria um novo post associado ao usuário autenticado.
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Criando novo Post' },
        content: {
          type: 'string',
          example: 'Aqui está um exemplo de conteúdo',
        },
      },
      required: ['title', 'content'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Post criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Título do Post' },
        content: {
          type: 'string',
          example: 'Aqui está um exemplo de conteúdo',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T22:30:31.104Z',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Nome Comum' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação, retorna o campo que está incorreto',
  })
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUserId() userId: number,
  ) {
    return this.postService.create(createPostDto, userId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista os posts, paginados',
    description: `Retorna os posts do mais novo para o mais antigo, em páginas (?page=1&limit=10, máximo 50).  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiResponse({
    status: 200,
    description:
      'Uma página de posts (data), com o autor e as respostas, e a paginação (meta)',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'object' } },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 42 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'page ou limit inválidos' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.postService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca um post pelo ID',
    description: `Retorna um post e o usuário autor correspondente.  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiParam({ name: 'id', type: 'number', example: 5 })
  @ApiResponse({
    status: 200,
    description: 'Post encontrado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 5 },
        title: { type: 'string', example: 'Post para testar answers' },
        content: {
          type: 'string',
          example: 'Esse é o conteúdo do segundo post',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-09T01:27:28.607Z',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 5 },
            name: { type: 'string', example: 'Nome Comum' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza um post pelo ID',
    description: `Permite atualizar o título e/ou conteúdo de um post existente.  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Título atualizado' },
        content: { type: 'string', example: 'Novo conteúdo atualizado' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Post atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 5 },
        title: { type: 'string', example: 'Título atualizado' },
        content: { type: 'string', example: 'Novo conteúdo atualizado' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-09T01:27:28.607Z',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 2 },
            name: { type: 'string', example: 'Lucas Mabele' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação, retorna o campo que está incorreto',
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUserId() userId: number,
  ) {
    return this.postService.update(id, updatePostDto, userId);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deleta um post pelo ID',
    description: `Remove um post existente e retorna seus dados.  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiParam({ name: 'id', type: 'number', example: 5 })
  @ApiResponse({
    status: 200,
    description: 'Post deletado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 5 },
        title: { type: 'string', example: 'Post deletado' },
        content: { type: 'string', example: 'Conteúdo deletado' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-09T01:27:28.607Z',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 5 },
            name: { type: 'string', example: 'Nome Comum' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ) {
    return this.postService.remove(id, userId);
  }
}
