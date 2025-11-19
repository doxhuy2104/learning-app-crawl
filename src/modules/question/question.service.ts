import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionService {
    constructor(
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
    ) { }

    async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
        const question = this.questionRepository.create(createQuestionDto);
        return await this.questionRepository.save(question);
    }

    async findAll(): Promise<Question[]> {
        return await this.questionRepository.find({
            relations: ['exam', 'answers'],
        });
    }

    async findOne(id: number): Promise<Question | null> {
        return await this.questionRepository.findOne({
            where: { id },
            relations: ['exam', 'answers'],
        });
    }

    async findByExamId(examId: number): Promise<Question[]> {
        return await this.questionRepository.find({
            where: { examId },
            relations: ['answers'],
            order: { orderIndex: 'ASC' },
        });
    }

    async update(id: number, updateData: Partial<CreateQuestionDto>): Promise<Question | null> {
        await this.questionRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.questionRepository.delete(id);
    }
}

