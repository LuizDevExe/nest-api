import { UserService } from './user.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Prisma, User as UserModel } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateUserDto } from './dto/user-post.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('')
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'usuario@email.com' },
        name: { type: 'string', example: 'João Silva' },
        password: { type: 'string', example: 'SenhaForte123!' },
      },
      required: ['email', 'name', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'usuario@email.com' },
        name: { type: 'string', example: 'João Silva' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T22:30:31.104Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T22:30:31.104Z',
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação, retorna o campo que está incorreto',
  })
  async signupUser(
    @Body(new ValidationPipe()) userData: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.createUser(userData);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca usuário pelo ID',
    description: `Recebe um id pelo parâmetro e retorna o usuário de mesmo id. 
    \nRota protegida, para acessar é preciso fazer um sign-in e obter o token na rota auth/signin.`,
  })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'usuario@email.com' },
        name: { type: 'string', example: 'João Silva' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T22:30:31.104Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T22:30:31.104Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Omit<UserModel, 'password'> | null> {
    const user = await this.userService.getUser({ id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza um usuário pelo ID',
    description: `Recebe um id pelo parâmetro e atualiza o usuário de mesmo id, a atualização pode ser parcial. 
    \nRota protegida, para acessar é preciso fazer um sign-in e obter o token na rota auth/signin.`,
  })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'usuario@email.com' },
        name: { type: 'string', example: 'João Silva' },
        password: { type: 'string', example: 'NovaSenha123!' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'usuario@email.com' },
        name: { type: 'string', example: 'João Silva' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T22:30:31.104Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-09T10:00:00.000Z',
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
    description: 'Usuário não encontrado',
  })
  async updateUser(
    @Body(new ValidationPipe()) userData: UpdateUserDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser({
      where: { id },
      data: userData,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deleta um usuário pelo ID',
    description: `Recebe um id pelo parâmetro e deleta o usuário de mesmo id. 
    \nRota protegida, para acessar é preciso fazer um sign-in e obter o token na rota auth/signin.`,
  })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Retorna o usuário deletado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'usuario@email.com' },
        name: { type: 'string', example: 'João Silva' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T22:30:31.104Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-08T22:30:31.104Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async deletePost(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.userService.deleteUser({ id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }
}
