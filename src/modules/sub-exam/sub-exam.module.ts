import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubExamService } from './sub-exam.service';
import { SubExam } from './entities/sub-exam.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SubExam])],
    providers: [SubExamService],
    exports: [SubExamService],
})
export class SubExamModule { }

