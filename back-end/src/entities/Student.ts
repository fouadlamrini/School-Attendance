import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Class } from './Class';
import { Attendance } from './Attendance';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.students)
  classEntity!: Class;

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendances!: Attendance[];
}
