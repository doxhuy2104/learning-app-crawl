import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonService {
    constructor(
        @InjectRepository(Lesson)
        private lessonRepository: Repository<Lesson>,
    ) { }

    async create(createLessonDto: CreateLessonDto): Promise<Lesson> {
        const lesson = this.lessonRepository.create(createLessonDto);
        return await this.lessonRepository.save(lesson);
    }

    async findAll(): Promise<Lesson[]> {
        return await this.lessonRepository.find({
            relations: ['course'],
        });
    }

    async findOne(id: number): Promise<Lesson | null> {
        return await this.lessonRepository.findOne({
            where: { id },
            relations: ['course', 'exams'],
        });
    }

    async findByCourseId(courseId: number): Promise<Lesson[]> {
        return await this.lessonRepository.find({
            where: { courseId },
            order: { orderIndex: 'ASC' },
        });
    }

    async findByurl(url: string): Promise<Lesson | null> {
        return await this.lessonRepository.findOne({
            where: { url },
        });
    }

    async update(id: number, updateData: Partial<CreateLessonDto>): Promise<Lesson | null> {
        await this.lessonRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.lessonRepository.delete(id);
    }
}

