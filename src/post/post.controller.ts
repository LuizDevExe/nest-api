import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

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
        content: { type: 'string', example: 'Aqui está um exemplo de conteúdo' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T22:30:31.104Z',
        },
        user: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Nome Comum' },
            email: { type: 'string', example: 'exemplo@email.com' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação, retorna o campo que está incorreto',
  })

  create(@Body() createPostDto: CreatePostDto, @Request() req: any) {
    const userId = req.user.sub;
    return this.postService.create(createPostDto, userId);
  }

  @Get()
  @UseGuards(AuthGuard)

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca todos os posts',
    description: `Retorna todos os post.  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Post encontrado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 5 },
        title: { type: 'string', example: 'Post para testar answers' },
        content: { type: 'string', example: 'Esse é o conteúdo do segundo post' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-09T01:27:28.607Z',
        },
        user: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Nome Comum' },
            email: { type: 'string', example: 'exemplo@email.com' },
          },
        },
        answers:{
          type: 'array',
          items:{
            type:'object',
          }
        }
      },
    },
  })

  findAll() {
    return this.postService.findAll();
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
        content: { type: 'string', example: 'Esse é o conteúdo do segundo post' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-09T01:27:28.607Z',
        },
        user: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Nome Comum' },
            email: { type: 'string', example: 'exemplo@email.com' },
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
            name: { type: 'string', example: 'Lucas Mabele' },
            email: { type: 'string', example: 'user2@email.com' },
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
  ) {
    return this.postService.update(id, updatePostDto);
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
            name: { type: 'string', example: 'Nome Comum' },
            email: { type: 'string', example: 'exemplo@email.com' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postService.remove(id);
  }
}
