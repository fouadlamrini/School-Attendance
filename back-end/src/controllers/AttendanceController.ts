import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { Session } from '../entities/Session';
import { Class } from '../entities/Class';
import { Student } from '../entities/Student';
import { AttendanceStatus } from '../entities/enums/AttendanceStatus';

const attendanceRelations = [
  'session',
  'session.classEntity',
  'session.subject',
  'session.teacher',
  'student',
];

// Helpers
function validateId(id: string | number) {
  const num = Number(id);
  if (Number.isNaN(num) || num <= 0) throw new Error('Invalid id');
  return num;
}

function validateStatus(status: string) {
  const allowed = Object.values(AttendanceStatus);
  if (!allowed.includes(status as AttendanceStatus)) {
    throw new Error(`status must be one of: ${allowed.join(', ')}`);
  }
  return status as AttendanceStatus;
}

export class AttendanceController {
  static async create(req: Request<{}, {}, {
    className: string;
    date: string;
    studentName: string;
    studentEmail: string;
    status: string;
  }>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const { className, date, studentName, studentEmail, status } = req.body;

      // Basic validation
      if (!className?.trim() || !date?.trim() || !studentName?.trim() || !studentEmail?.trim()) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Invalid date format' });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(studentEmail)) return res.status(400).json({ message: 'Invalid email' });

      const validStatus = validateStatus(status);

      const classRepo = AppDataSource.getRepository(Class);
      const sessionRepo = AppDataSource.getRepository(Session);
      const studentRepo = AppDataSource.getRepository(Student);
      const attendanceRepo = AppDataSource.getRepository(Attendance);

      const classEntity = await classRepo.findOne({ where: { name: className.trim() } });
      if (!classEntity) return res.status(404).json({ message: 'Class not found' });

      const session = await sessionRepo.findOne({ where: { date, classEntity: { id: classEntity.id } as any } });
      if (!session) return res.status(404).json({ message: 'Session not found' });

      const student = await studentRepo.findOne({ where: { name: studentName.trim(), email: studentEmail.trim() } });
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const existing = await attendanceRepo.findOne({ where: { session: { id: session.id } as any, student: { id: student.id } as any } });
      if (existing) return res.status(409).json({ message: 'Attendance already recorded' });

      const attendance = attendanceRepo.create({ status: validStatus, session, student });
      const saved = await attendanceRepo.save(attendance);

      const result = await attendanceRepo.findOne({ where: { id: saved.id }, relations: attendanceRelations });
      return res.status(201).json({ data: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async update(req: Request<{ id: string }, {}, { status: string }>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const id = validateId(req.params.id);
      const status = validateStatus(req.body.status);

      const attendanceRepo = AppDataSource.getRepository(Attendance);
      const attendance = await attendanceRepo.findOne({ where: { id }, relations: ['session', 'student'] });
      if (!attendance) return res.status(404).json({ message: 'Attendance not found' });

      attendance.status = status;
      await attendanceRepo.save(attendance);

      const result = await attendanceRepo.findOne({ where: { id }, relations: attendanceRelations });
      return res.status(200).json({ data: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getBySession(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const id = validateId(req.params.id);
      const attendanceRepo = AppDataSource.getRepository(Attendance);
      const attendances = await attendanceRepo.find({ where: { session: { id } as any }, relations: attendanceRelations });
      return res.status(200).json({ data: attendances });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getByStudent(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const id = validateId(req.params.id);
      const attendanceRepo = AppDataSource.getRepository(Attendance);
      const attendances = await attendanceRepo.find({ where: { student: { id } as any }, relations: attendanceRelations });
      return res.status(200).json({ data: attendances });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getByClass(req: Request<{ id: string }>, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const classId = validateId(req.params.id);
      const attendanceRepo = AppDataSource.getRepository(Attendance);
      const attendances = await attendanceRepo.find({
        where: { session: { classEntity: { id: classId } } as any },
        relations: attendanceRelations,
      });
      return res.status(200).json({ data: attendances });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default AttendanceController;
