import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Exam } from '../../exam/entities/exam.entity';
import { Answer } from '../../answer/entities/answer.entity';
import { Paragraph } from 'src/modules/paragraph/entities/paragraph.entity';
import { SubExam } from '../../sub-exam/entities/sub-exam.entity';

@Entity('questions')
export class Question {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'varchar', length: 100, default: 'choice' })
    type: string; // 'choice', 'true_false', 'short_answer'

    @Column({ type: 'varchar', length: 100, default: 'html' })
    dataType: string;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @Column({ type: 'text', nullable: true })
    explanation: string;

    @Column({ type: 'int' })
    examId: number;

    // @Column({ type: 'int', nullable: true })
    // paragraphId: number;

    // @ManyToOne(() => Paragraph, paragraph => paragraph.questions, { onDelete: 'CASCADE' })
    // @JoinColumn({ name: 'paragraphId' })
    // paragraph: Paragraph;

    @ManyToOne(() => Exam, exam => exam.questions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examId' })
    exam: Exam;

    @Column({ type: 'int', nullable: true })
    subExamId: number;

    @ManyToOne(() => SubExam, subExam => subExam.questions, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'subExamId' })
    subExam: SubExam;

    @OneToMany(() => Answer, answer => answer.question)
    answers: Answer[];

    @Column({ type: 'varchar', length: 100, nullable: true })
    shortAnswer: string;

    @Column({ type: 'boolean', nullable: true })
    trueFalse: boolean;
}

