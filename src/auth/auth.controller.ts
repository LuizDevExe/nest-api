import { AuthService } from './auth.service';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Realiza o login do usuário',
    description: `Autentica um usuário existente no sistema.  
    Retorna um **token JWT (Bearer Token)** que deve ser usado nas rotas protegidas com o decorator **@ApiBearerAuth()**.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido, retorna o token JWT',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Credenciais inválidas. A resposta é a mesma para e-mail desconhecido e senha errada.',
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação, retorna o campo que está incorreto',
  })
  signIn(@Body() body: SignInDto) {
    return this.authService.signIn(body);
  }
}
