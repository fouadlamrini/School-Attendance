import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { AttendanceStatus } from '../entities/enums/AttendanceStatus';

/**
 * Controller returning simple admin statistics for attendance.
 * Each line is commented to explain intent and behavior.
 */
export class StatsController {
  /**
   * GET /stats/class/:id
   * Returns counts of absences and late for a given class id.
   */
  static async getClassStats(req: Request<{ id: string }>, res: Response) {
    try {
      // Parse class id from route params and validate
      const classId = Number(req.params.id);
      if (Number.isNaN(classId) || classId <= 0) {
        return res.status(400).json({ message: 'Invalid class id' });
      }

      // Ensure requester is authenticated (middleware should have run)
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      // Use repository to build queries
      const attendanceRepo = AppDataSource.getRepository(Attendance);

      // Count absences for the class by joining session -> classEntity
      const absences = await attendanceRepo
        .createQueryBuilder('attendance')
        .leftJoin('attendance.session', 'session')
        .leftJoin('session.classEntity', 'classEntity')
        .where('classEntity.id = :classId', { classId })
        .andWhere('attendance.status = :status', {
          status: AttendanceStatus.ABSENT,
        })
        .getCount();

      // Count late occurrences for the class
      const late = await attendanceRepo
        .createQueryBuilder('attendance')
        .leftJoin('attendance.session', 'session')
        .leftJoin('session.classEntity', 'classEntity')
        .where('classEntity.id = :classId', { classId })
        .andWhere('attendance.status = :status', {
          status: AttendanceStatus.LATE,
        })
        .getCount();

      // If the client requested CSV via ?format=csv, return CSV text
      if (String(req.query.format || '').toLowerCase() === 'csv') {
        const csv = `metric,count\nabsent,${absences}\nlate,${late}\n`;
        res.setHeader('Content-Type', 'text/csv');
        return res.status(200).send(csv);
      }

      // Otherwise return JSON with counts
      return res.status(200).json({ classId, absences, late });
    } catch (err) {
      // Log server error and return 500
      console.error('Error fetching class stats', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * GET /stats/student/:id
   * Returns counts of absences and late for a given student id.
   */
  static async getStudentStats(req: Request<{ id: string }>, res: Response) {
    try {
      // Parse and validate student id
      const studentId = Number(req.params.id);
      if (Number.isNaN(studentId) || studentId <= 0) {
        return res.status(400).json({ message: 'Invalid student id' });
      }

      // Ensure requester is authenticated
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      // Use repository to count by filtering attendance.student
      const attendanceRepo = AppDataSource.getRepository(Attendance);

      // Count absences for the student
      const absences = await attendanceRepo
        .createQueryBuilder('attendance')
        .leftJoin('attendance.student', 'student')
        .where('student.id = :studentId', { studentId })
        .andWhere('attendance.status = :status', {
          status: AttendanceStatus.ABSENT,
        })
        .getCount();

      // Count late for the student
      const late = await attendanceRepo
        .createQueryBuilder('attendance')
        .leftJoin('attendance.student', 'student')
        .where('student.id = :studentId', { studentId })
        .andWhere('attendance.status = :status', {
          status: AttendanceStatus.LATE,
        })
        .getCount();

      // Optional CSV export
      if (String(req.query.format || '').toLowerCase() === 'csv') {
        const csv = `metric,count\nabsent,${absences}\nlate,${late}\n`;
        res.setHeader('Content-Type', 'text/csv');
        return res.status(200).send(csv);
      }

      // Return JSON with computed stats
      return res.status(200).json({ studentId, absences, late });
    } catch (err) {
      // Log and return generic server error
      console.error('Error fetching student stats', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default StatsController;
