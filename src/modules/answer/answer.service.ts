import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from './entities/answer.entity';
import { CreateAnswerDto } from './dto/create-answer.dto';

@Injectable()
export class AnswerService {
    constructor(
        @InjectRepository(Answer)
        private answerRepository: Repository<Answer>,
    ) { }

    async create(createAnswerDto: CreateAnswerDto): Promise<Answer> {
        const answer = this.answerRepository.create(createAnswerDto);
        return await this.answerRepository.save(answer);
    }

    async findAll(): Promise<Answer[]> {
        return await this.answerRepository.find({
            relations: ['question'],
        });
    }

    async findOne(id: number): Promise<Answer | null> {
        return await this.answerRepository.findOne({
            where: { id },
            relations: ['question'],
        });
    }

    async findByQuestionId(questionId: number): Promise<Answer[]> {
        return await this.answerRepository.find({
            where: { questionId },
            order: { orderIndex: 'ASC' },
        });
    }

    async update(id: number, updateData: Partial<CreateAnswerDto>): Promise<Answer | null> {
        await this.answerRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.answerRepository.delete(id);
    }
}

