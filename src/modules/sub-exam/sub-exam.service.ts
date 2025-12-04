import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubExam } from './entities/sub-exam.entity';
import { CreateSubExamDto } from './dto/create-sub-exam.dto';

@Injectable()
export class SubExamService {
    constructor(
        @InjectRepository(SubExam)
        private subExamRepository: Repository<SubExam>,
    ) { }

    async create(createSubExamDto: CreateSubExamDto): Promise<SubExam> {
        const subExam = this.subExamRepository.create(createSubExamDto);
        return await this.subExamRepository.save(subExam);
    }

    async findAll(): Promise<SubExam[]> {
        return await this.subExamRepository.find({
            relations: ['exam', 'questions'],
        });
    }

    async findOne(id: number): Promise<SubExam | null> {
        return await this.subExamRepository.findOne({
            where: { id },
            relations: ['exam', 'questions'],
        });
    }

    async findByExamId(examId: number): Promise<SubExam[]> {
        return await this.subExamRepository.find({
            where: { examId },
            order: { orderIndex: 'ASC' },
        });
    }

    async findByUrl(url: string): Promise<SubExam | null> {
        return await this.subExamRepository.findOne({
            where: { url },
        });
    }

    async update(id: number, updateData: Partial<CreateSubExamDto>): Promise<SubExam | null> {
        await this.subExamRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.subExamRepository.delete(id);
    }
}

