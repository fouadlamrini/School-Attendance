import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { AttendanceStatus } from '../entities/enums/AttendanceStatus';

// دالة مستقلة لحساب عدد الحضور حسب status و entity
async function countStatus(
  filter: Partial<{ studentId: number; classId: number }>,
  status: AttendanceStatus
): Promise<number> {
  const repo = AppDataSource.getRepository(Attendance);

  if (filter.studentId) {
    return repo.count({
      where: { student: { id: filter.studentId }, status },
    });
  }

  if (filter.classId) {
    return repo.count({
      where: { session: { classEntity: { id: filter.classId } }, status },
    });
  }

  return 0;
}

export class StatsController {
  static async getClassStats(req: Request<{ id: string }>, res: Response) {
    try {
      const classId = Number(req.params.id);
      if (Number.isNaN(classId) || classId <= 0) {
        return res.status(400).json({ message: 'Invalid class id' });
      }
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const absences = await countStatus({ classId }, AttendanceStatus.ABSENT);
      const late = await countStatus({ classId }, AttendanceStatus.LATE);

      if (String(req.query.format || '').toLowerCase() === 'csv') {
        const csv = `metric,count\nabsent,${absences}\nlate,${late}\n`;
        res.setHeader('Content-Type', 'text/csv');
        return res.status(200).send(csv);
      }

      return res.status(200).json({ classId, absences, late });
    } catch (err) {
      console.error('Error fetching class stats', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getStudentStats(req: Request<{ id: string }>, res: Response) {
    try {
      const studentId = Number(req.params.id);
      if (Number.isNaN(studentId) || studentId <= 0) {
        return res.status(400).json({ message: 'Invalid student id' });
      }
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const absences = await countStatus({ studentId }, AttendanceStatus.ABSENT);
      const late = await countStatus({ studentId }, AttendanceStatus.LATE);

      if (String(req.query.format || '').toLowerCase() === 'csv') {
        const csv = `metric,count\nabsent,${absences}\nlate,${late}\n`;
        res.setHeader('Content-Type', 'text/csv');
        return res.status(200).send(csv);
      }

      return res.status(200).json({ studentId, absences, late });
    } catch (err) {
      console.error('Error fetching student stats', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default StatsController;
