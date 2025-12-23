import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Student } from './Student';
import { Session } from './Session';

@Entity()
export class Class {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => Student, (student) => student.classEntity)
  students!: Student[];

  @OneToMany(() => Session, (session) => session.classEntity)
  sessions!: Session[];
}
