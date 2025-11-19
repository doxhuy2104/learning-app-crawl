import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CourseService {
    constructor(
        @InjectRepository(Course)
        private courseRepository: Repository<Course>,
    ) { }

    async create(createCourseDto: CreateCourseDto): Promise<Course> {
        const course = this.courseRepository.create(createCourseDto);
        return await this.courseRepository.save(course);
    }

    async findAll(): Promise<Course[]> {
        return await this.courseRepository.find({
            relations: ['lessons'],
        });
    }

    async findOne(id: number): Promise<Course | null> {
        return await this.courseRepository.findOne({
            where: { id },
            relations: ['lessons'],
        });
    }

    async findByurl(url: string): Promise<Course | null> {
        return await this.courseRepository.findOne({
            where: { url },
        });
    }

    async update(id: number, updateData: Partial<CreateCourseDto>): Promise<Course | null> {
        await this.courseRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.courseRepository.delete(id);
    }
}

