import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from '../../question/entities/question.entity';

@Entity('answers')
export class Answer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'boolean', default: false })
    isCorrect: boolean;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @Column({ type: 'int' })
    questionId: number;

    @ManyToOne(() => Question, question => question.answers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'questionId' })
    question: Question;
}

