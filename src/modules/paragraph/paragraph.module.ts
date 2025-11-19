import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParagraphService } from './paragraph.service';
import { Paragraph } from './entities/paragraph.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Paragraph])],
    providers: [ParagraphService],
    exports: [ParagraphService],
})
export class ParagraphModule { }

