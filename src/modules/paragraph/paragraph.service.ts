import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paragraph } from './entities/paragraph.entity';
import { CreateParagraphDto } from './dto/create-paragraph.dto';

@Injectable()
export class ParagraphService {
    constructor(
        @InjectRepository(Paragraph)
        private paragraphRepository: Repository<Paragraph>,
    ) { }

    async create(createParagraphDto: CreateParagraphDto): Promise<Paragraph> {
        const paragraph = this.paragraphRepository.create(createParagraphDto);
        return await this.paragraphRepository.save(paragraph);
    }

    async findAll(): Promise<Paragraph[]> {
        return await this.paragraphRepository.find({
            relations: ['questions'],
        });
    }

    async findOne(id: number): Promise<Paragraph | null> {
        return await this.paragraphRepository.findOne({
            where: { id },
            relations: ['questions'],
        });
    }

    async findByTitleExamId(titleExamId: string): Promise<Paragraph | null> {
        return await this.paragraphRepository.findOne({
            where: { titleExamId },
        });
    }

    async update(id: number, updateData: Partial<CreateParagraphDto>): Promise<Paragraph | null> {
        await this.paragraphRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.paragraphRepository.delete(id);
    }
}

