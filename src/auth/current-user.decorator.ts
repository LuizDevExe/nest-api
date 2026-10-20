import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// O id do usuário logado, gravado pelo AuthGuard a partir do token (campo sub).
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number =>
    ctx.switchToHttp().getRequest<{ user: { sub: number } }>().user.sub,
);
