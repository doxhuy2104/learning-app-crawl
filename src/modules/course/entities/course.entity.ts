import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Lesson } from '../../lesson/entities/lesson.entity';

@Entity('courses')
export class Course {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'varchar', length: 1000, nullable: true })
    url: string;

    @OneToMany(() => Lesson, lesson => lesson.course)
    lessons: Lesson[];
}

