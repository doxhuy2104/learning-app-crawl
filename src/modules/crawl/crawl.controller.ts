import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlRequestDto } from './dto/crawl-request.dto';

@Controller('crawl')
export class CrawlController {
    constructor(private readonly crawlService: CrawlService) { }

    @Post('courses')
    async crawlCourses(@Body() dto: CrawlRequestDto) {
        return await this.crawlService.crawlCourses(dto.cookie);
    }

    @Post('exams/tsa')
    async crawlExams(@Body() dto: CrawlRequestDto) {
        return await this.crawlService.crawlExamsTSA(dto.cookie);
    }

    @Post('questions')
    async crawlQuestions(@Body() dto: CrawlRequestDto) {
        return await this.crawlService.crawlQuestions(dto.examId, dto.url, dto.cookie);
    }

    // @Post('questions/thpt')
    // async crawlQuestionsTHPT(@Body() dto: CrawlRequestDto) {
    //     return await this.crawlService.crawlQuestions(0,dto.url, dto.cookie);
    // }

    @Post('paragraphs')
    async crawlParagraphs(@Body() dto: CrawlRequestDto) {
        return await this.crawlService.crawlParagraphs(dto.url, dto.cookie);
    }

    @Get('tsa')
    async crawlPage(@Param('isExam') isExam: boolean) {
        return await this.crawlService.crawlTSA(isExam);
    }

    @Post('thpt')
    async crawlTHPT(@Body() dto: CrawlRequestDto) {
        return await this.crawlService.crawlTHPT(dto.cookie);
    }

    @Post('url')
    async crawlUrl(@Body() dto: CrawlRequestDto) {
        return await this.crawlService.crawlUrl(dto.url, dto.cookie);
    }
}

