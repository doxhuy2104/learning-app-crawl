import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamService } from './exam.service';
import { Exam } from './entities/exam.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Exam])],
    providers: [ExamService],
    exports: [ExamService],
})
export class ExamModule { }

