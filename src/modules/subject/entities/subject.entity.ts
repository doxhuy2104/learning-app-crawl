import { Course } from 'src/modules/course/entities/course.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('subjects')
export class Subject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'varchar', length: 1000, nullable: true })
    url: string;

    @Column({ type: 'varchar', length: 1000, nullable: true })
    image: string;
}

