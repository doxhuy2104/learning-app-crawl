import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionService } from './question.service';
import { Question } from './entities/question.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Question])],
    providers: [QuestionService],
    exports: [QuestionService],
})
export class QuestionModule { }

