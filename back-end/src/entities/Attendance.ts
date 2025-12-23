import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { AttendanceStatus } from './enums/AttendanceStatus';
import { Session } from './Session';
import { Student } from './Student';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
  })
  status!: AttendanceStatus;

  @ManyToOne(() => Session, (session: Session) => session.attendances)
  session!: Session;

  @ManyToOne(() => Student, (student: Student) => student.attendances)
  student!: Student;
}
