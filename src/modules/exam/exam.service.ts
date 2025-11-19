import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamService {
    constructor(
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
    ) { }

    async create(createExamDto: CreateExamDto): Promise<Exam> {
        const exam = this.examRepository.create(createExamDto);
        return await this.examRepository.save(exam);
    }

    async findAll(): Promise<Exam[]> {
        return await this.examRepository.find({
            relations: ['lesson', 'questions'],
        });
    }

    async findOne(id: number): Promise<Exam | null> {
        return await this.examRepository.findOne({
            where: { id },
            relations: ['lesson', 'questions'],
        });
    }

    async findByLessonId(lessonId: number): Promise<Exam[]> {
        return await this.examRepository.find({
            where: { lessonId },
            order: { orderIndex: 'ASC' },
        });
    }

    async findByurl(url: string): Promise<Exam | null> {
        return await this.examRepository.findOne({
            where: { url },
        });
    }

    async update(id: number, updateData: Partial<CreateExamDto>): Promise<Exam | null> {
        await this.examRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.examRepository.delete(id);
    }
}

