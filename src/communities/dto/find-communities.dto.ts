import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination';

export class FindCommunitiesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Só comunidades onde o chamador é membro ativo',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mine?: boolean;
}
