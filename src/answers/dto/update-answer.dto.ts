import { PartialType } from '@nestjs/mapped-types';
import { CreateAnswerDto } from './create-answer.dto';
import { IsOptional } from 'class-validator';

export class UpdateAnswerDto extends PartialType(CreateAnswerDto) {
    @IsOptional()
    id?: number; 
}
