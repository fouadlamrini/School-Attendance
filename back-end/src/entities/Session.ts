import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Class } from './Class';
import { Subject } from './Subject';
import { User } from './User';
import { Attendance } from './Attendance';

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  date!: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.sessions)
  classEntity!: Class;

  @ManyToOne(() => Subject, (subject) => subject.sessions)
  subject!: Subject;

  @ManyToOne(() => User, (user) => user.sessions)
  teacher!: User;

  @OneToMany(() => Attendance, (attendance) => attendance.session)
  attendances!: Attendance[];
}
