import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectService {
    constructor(
        @InjectRepository(Subject)
        private subjectRepository: Repository<Subject>,
    ) { }

    async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
        const subject = this.subjectRepository.create(createSubjectDto);
        return await this.subjectRepository.save(subject);
    }

    async findAll(): Promise<Subject[]> {
        return await this.subjectRepository.find({
            relations: ['lessons'],
        });
    }

    async findOne(id: number): Promise<Subject | null> {
        return await this.subjectRepository.findOne({
            where: { id },
            relations: ['lessons'],
        });
    }

    async findByurl(url: string): Promise<Subject | null> {
        return await this.subjectRepository.findOne({
            where: { url },
        });
    }

    async update(id: number, updateData: Partial<CreateSubjectDto>): Promise<Subject | null> {
        await this.subjectRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.subjectRepository.delete(id);
    }
}

