import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectService } from './subject.service';
import { Subject } from './entities/subject.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Subject])],
    providers: [SubjectService],
    exports: [SubjectService],
})
export class SubjectModule { }

