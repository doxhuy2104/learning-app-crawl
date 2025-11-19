import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Question } from '../../question/entities/question.entity';
import { Lesson } from 'src/modules/lesson/entities/lesson.entity';

@Entity('exams')
export class Exam {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 1000, nullable: true })
    url: string;

    @Column({ type: 'int', default: 0 })
    totalQuestions: number;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @Column({ type: 'int', nullable: true })
    lessonId: number;

    @ManyToOne(() => Lesson, lesson => lesson.exams, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'lessonId' })
    lesson: Lesson;

    @OneToMany(() => Question, question => question.exam)
    questions: Question[];
}

