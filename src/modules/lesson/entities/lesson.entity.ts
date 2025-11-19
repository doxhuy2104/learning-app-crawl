import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from '../../course/entities/course.entity';
import { Exam } from 'src/modules/exam/entities/exam.entity';

@Entity('lessons')
export class Lesson {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'varchar', length: 1000, nullable: true })
    url: string;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @Column({ type: 'int' })
    courseId: number;

    @ManyToOne(() => Course, course => course.lessons, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'courseId' })
    course: Course;

    @OneToMany(() => Exam, (exam) => exam.lesson)
    exams: Exam[];
}

