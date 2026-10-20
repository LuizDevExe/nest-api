import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUserId } from 'src/auth/current-user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post(':postId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria uma nova resposta para um post',
    description: `Cria uma nova resposta (comentário) associada a um post e ao usuário autenticado. O id do post que vai receber o comentário é passado no parâmetro.  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          example: 'Essa é uma resposta para o post indicado.',
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Resposta criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 16 },
        postId: { type: 'number', example: 2 },
        content: {
          type: 'string',
          example: 'Essa é uma resposta para o post indicado.',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T23:16:02.157Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T23:16:02.157Z',
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
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  create(
    @Body() createAnswerDto: CreateAnswerDto,
    @CurrentUserId() userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.answersService.create(createAnswerDto, userId, postId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todas as respostas',
    description: `Retorna todas as respostas criadas, junto com o autor de cada uma.  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de respostas retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 16 },
          postId: { type: 'number', example: 2 },
          content: { type: 'string', example: 'teste' },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-10-08T23:16:02.157Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-10-08T23:16:02.157Z',
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
    },
  })
  findAll() {
    return this.answersService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca uma resposta pelo ID',
    description: `Retorna uma resposta específica com o autor da answer.  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiParam({ name: 'id', type: 'number', example: 16 })
  @ApiResponse({
    status: 200,
    description: 'Resposta encontrada',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 16 },
        postId: { type: 'number', example: 2 },
        content: {
          type: 'string',
          example: 'Atualizando comentário para post do user 2',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T23:16:02.157Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T23:16:39.571Z',
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
    status: 404,
    description: 'Post não encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.answersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza uma resposta pelo ID',
    description: `Permite atualizar o conteúdo de uma resposta existente.  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          example: 'Atualizando comentário para post do user 2',
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resposta atualizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 16 },
        content: {
          type: 'string',
          example: 'Atualizando comentário para post do user 2',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T23:16:02.157Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T23:16:39.571Z',
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
  @ApiResponse({ status: 403, description: 'A resposta é de outra pessoa' })
  @ApiResponse({ status: 404, description: 'Resposta não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Campo desconhecido ou valor inválido',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnswerDto: UpdateAnswerDto,
    @CurrentUserId() userId: number,
  ) {
    return this.answersService.update(id, updateAnswerDto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deleta uma resposta pelo ID',
    description: `Remove uma resposta existente e retorna seus dados.  
    \nRota protegida — é necessário fazer sign-in e enviar o Bearer token.`,
  })
  @ApiParam({ name: 'id', type: 'number', example: 3 })
  @ApiResponse({
    status: 200,
    description: 'Resposta deletada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 3 },
        content: {
          type: 'string',
          example: 'Atualizando comentário para post do user 2',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T01:53:37.664Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T01:53:55.230Z',
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
  @ApiResponse({ status: 404, description: 'Resposta não encontrada' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ) {
    return this.answersService.remove(id, userId);
  }
}
