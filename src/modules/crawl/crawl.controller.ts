import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlRequestDto } from './dto/crawl-request.dto';

@Controller('crawl')
export class CrawlController {
    constructor(private readonly crawlService: CrawlService) { }

    @Get()
    async crawl() {
        return await this.crawlService.crawl();
    }

    @Get('first')
    async crawlPage() {
        return await this.crawlService.crawlFirstPage();
    }

    @Post('url')
    async crawlUrl(@Body() dto: CrawlRequestDto) {
        return await this.crawlService.crawlUrl(dto.url, dto.cookie);
    }
}

