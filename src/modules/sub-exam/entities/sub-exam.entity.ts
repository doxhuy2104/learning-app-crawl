import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Question } from '../../question/entities/question.entity';
import { Exam } from 'src/modules/exam/entities/exam.entity';

@Entity('subexams')
export class SubExam {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'varchar', length: 1000, nullable: true })
    url: string;

    @Column({ type: 'int', default: 0 })
    totalQuestions: number;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @Column({ type: 'int' })
    examId: number;

    @ManyToOne(() => Exam, exam => exam.subExams, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examId' })
    exam: Exam;

    @OneToMany(() => Question, question => question.subExam)
    questions: Question[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

