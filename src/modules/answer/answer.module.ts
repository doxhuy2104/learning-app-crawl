import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerService } from './answer.service';
import { Answer } from './entities/answer.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Answer])],
    providers: [AnswerService],
    exports: [AnswerService],
})
export class AnswerModule { }

