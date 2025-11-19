import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonService } from './lesson.service';
import { Lesson } from './entities/lesson.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Lesson])],
    providers: [LessonService],
    exports: [LessonService],
})
export class LessonModule { }

