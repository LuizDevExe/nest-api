import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UserTargetDto } from './dto/user-target.dto';
import { FindCommunitiesDto } from './dto/find-communities.dto';
import { PaginationQueryDto } from 'src/common/pagination';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUserId } from 'src/auth/current-user.decorator';

@ApiTags('Communities')
@Controller('communities')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria uma comunidade',
    description:
      'Cria uma comunidade nova com o usuário autenticado como OWNER.',
  })
  @ApiResponse({ status: 201, description: 'Comunidade criada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Slug, nome ou descrição inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Slug já usado por outra comunidade',
  })
  create(@Body() dto: CreateCommunityDto, @CurrentUserId() userId: number) {
    return this.communitiesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista comunidades, paginadas',
    description:
      'Com mine=true devolve só as comunidades onde o chamador é membro ativo.',
  })
  @ApiResponse({ status: 200, description: 'Página de comunidades' })
  findAll(@Query() query: FindCommunitiesDto, @CurrentUserId() userId: number) {
    return this.communitiesService.findAll(query, userId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Busca uma comunidade pelo slug' })
  @ApiParam({ name: 'slug', example: 'nest-br' })
  @ApiResponse({ status: 200, description: 'Comunidade encontrada' })
  @ApiResponse({ status: 404, description: 'Comunidade não encontrada' })
  findOne(@Param('slug') slug: string, @CurrentUserId() userId: number) {
    return this.communitiesService.findOne(slug, userId);
  }

  @Patch(':slug')
  @ApiOperation({
    summary: 'Edita nome e/ou descrição da comunidade',
    description: 'Exige cargo admin ou acima.',
  })
  @ApiParam({ name: 'slug', example: 'nest-br' })
  @ApiResponse({ status: 200, description: 'Comunidade atualizada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Comunidade não encontrada' })
  update(
    @Param('slug') slug: string,
    @Body() dto: UpdateCommunityDto,
    @CurrentUserId() userId: number,
  ) {
    return this.communitiesService.update(slug, dto, userId);
  }

  @Delete(':slug')
  @ApiOperation({
    summary: 'Apaga a comunidade',
    description: 'Só o dono pode apagar; posts e respostas saem em cascata.',
  })
  @ApiParam({ name: 'slug', example: 'nest-br' })
  @ApiResponse({ status: 200, description: 'Comunidade apagada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Comunidade não encontrada' })
  remove(@Param('slug') slug: string, @CurrentUserId() userId: number) {
    return this.communitiesService.remove(slug, userId);
  }

  @Get(':slug/members')
  @ApiOperation({
    summary: 'Lista os membros ativos da comunidade',
    description:
      'Ordenado por cargo (desc) e depois por data de entrada (asc). Qualquer usuário logado pode ver.',
  })
  @ApiParam({ name: 'slug', example: 'nest-br' })
  @ApiResponse({ status: 200, description: 'Página de membros' })
  @ApiResponse({ status: 404, description: 'Comunidade não encontrada' })
  members(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.communitiesService.members(slug, query);
  }

  @Post(':slug/members')
  @ApiOperation({ summary: 'Entra na comunidade' })
  @ApiParam({ name: 'slug', example: 'nest-br' })
  @ApiResponse({ status: 201, description: 'Agora é membro' })
  @ApiResponse({ status: 403, description: 'Banido desta comunidade' })
  @ApiResponse({ status: 404, description: 'Comunidade não encontrada' })
  @ApiResponse({ status: 409, description: 'Já é membro' })
  join(@Param('slug') slug: string, @CurrentUserId() userId: number) {
    return this.communitiesService.join(slug, userId);
  }

  @Delete(':slug/members/me')
  @ApiOperation({
    summary: 'Sai da comunidade',
    description: 'O dono precisa transferir a posse antes de sair (409).',
  })
  @ApiParam({ name: 'slug', example: 'nest-br' })
  @ApiResponse({ status: 200, description: 'Saiu da comunidade' })
  @ApiResponse({ status: 404, description: 'Não é membro' })
  @ApiResponse({
    status: 409,
    description: 'O dono precisa transferir a posse antes',
  })
  leave(@Param('slug') slug: string, @CurrentUserId() userId: number) {
    return this.communitiesService.leave(slug, userId);
  }

  @Patch(':slug/members/:userId')
  @ApiOperation({
    summary: 'Muda o cargo de um membro',
    description:
      'Exige admin ou acima; o alvo e o cargo novo precisam ficar abaixo do cargo de quem chama.',
  })
  @ApiParam({ name: 'slug', example: 'nest-br' })
  @ApiParam({ name: 'userId', example: 2 })
  @ApiResponse({ status: 200, description: 'Cargo alterado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({
    status: 404,
    description: 'Comunidade ou membro não encontrado',
  })
  changeRole(
    @Param('slug') slug: string,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Body() dto: ChangeRoleDto,
    @CurrentUserId() userId: number,
  ) {
    return this.communitiesService.changeRole(
      slug,
      targetUserId,
      dto.role,
      userId,
    );
  }

  @Post(':slug/bans')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bane um membro',
    description:
      'Exige moderador ou acima, e só sobre alguém de cargo abaixo do seu. Rebaixa o alvo para MEMBER.',
  })
  @ApiParam({ name: 'slug', example: 'nest-br' })
  @ApiResponse({ status: 200, description: 'Membro banido' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({
    status: 404,
    description: 'Comunidade ou membro não encontrado',
  })
  ban(
    @Param('slug') slug: string,
    @Body() dto: UserTargetDto,
    @CurrentUserId() userId: number,
  ) {
    return this.communitiesService.ban(slug, dto.userId, userId);
  }

  @Post(':slug/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transfere a posse da comunidade',
    description:
      'Só o dono pode transferir; o alvo vira OWNER e o antigo dono vira ADMIN.',
  })
  @ApiParam({ name: 'slug', example: 'nest-br' })
  @ApiResponse({ status: 200, description: 'Posse transferida' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({
    status: 404,
    description: 'Comunidade ou membro não encontrado',
  })
  transfer(
    @Param('slug') slug: string,
    @Body() dto: UserTargetDto,
    @CurrentUserId() userId: number,
  ) {
    return this.communitiesService.transfer(slug, dto.userId, userId);
  }
}
