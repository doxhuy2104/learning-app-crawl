import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';
import { CourseModule } from '../course/course.module';
import { LessonModule } from '../lesson/lesson.module';
import { ExamModule } from '../exam/exam.module';
import { QuestionModule } from '../question/question.module';
import { AnswerModule } from '../answer/answer.module';
import { ParagraphModule } from '../paragraph/paragraph.module';

@Module({
    imports: [
        CourseModule,
        LessonModule,
        ExamModule,
        QuestionModule,
        AnswerModule,
        ParagraphModule
    ],
    controllers: [CrawlController],
    providers: [CrawlService],
    exports: [CrawlService],
})
export class CrawlModule { }

