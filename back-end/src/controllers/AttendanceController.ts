import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { Session } from '../entities/Session';
import { Class } from '../entities/Class';
import { Student } from '../entities/Student';
import { AttendanceStatus } from '../entities/enums/AttendanceStatus';

// Strongly-typed request body for creating attendance
// New body shape: identify session by class name + date, student by name + email
type CreateAttendanceBody = {
  className: string; // name of the class for the session
  date: string; // session date in YYYY-MM-DD format
  studentName: string; // student's name
  studentEmail: string; // student's email
  status: 'present' | 'absent' | 'late' | 'excused'; // allowed statuses
};

/**
 * Controller responsible for attendance operations.
 * Each line is commented to explain intent and behavior.
 */
export class AttendanceController {
  /**
   * POST /attendance
   * Creates a single attendance record for a student in a session.
   */
  static async create(
    req: Request<{}, {}, CreateAttendanceBody>,
    res: Response,
  ) {
    try {
      // Parse and validate the incoming body using strict typing
      const { className, date, studentName, studentEmail, status } = req.body;

      // Validate className is a non-empty string
      if (
        !className ||
        typeof className !== 'string' ||
        className.trim() === ''
      ) {
        return res.status(400).json({ message: 'className is required' });
      }

      // Validate date format YYYY-MM-DD
      if (
        !date ||
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {
        return res
          .status(400)
          .json({ message: 'date is required in YYYY-MM-DD format' });
      }

      // Validate studentName is a non-empty string
      if (
        !studentName ||
        typeof studentName !== 'string' ||
        studentName.trim() === ''
      ) {
        return res.status(400).json({ message: 'studentName is required' });
      }

      // Validate studentEmail is a non-empty string and looks like an email
      if (
        !studentEmail ||
        typeof studentEmail !== 'string' ||
        studentEmail.trim() === ''
      ) {
        return res.status(400).json({ message: 'studentEmail is required' });
      }
      // Basic email format check (simple, not RFC-perfect)
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(studentEmail)) {
        return res
          .status(400)
          .json({ message: 'studentEmail must be a valid email' });
      }

      // Validate status is one of the allowed enum values
      const allowedStatuses = Object.values(AttendanceStatus);
      if (
        typeof status !== 'string' ||
        !allowedStatuses.includes(status as AttendanceStatus)
      ) {
        return res.status(400).json({
          message: `status must be one of: ${allowedStatuses.join(', ')}`,
        });
      }

      // Ensure the requester is attached by the authenticate middleware
      // `authenticate` attaches `req.user`. If absent, authentication middleware didn't run.
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Ensure only TEACHER role can register attendance (enforced at route-level too)
      // This is defensive: check again in controller to avoid accidental exposure.
      // Importing UserRole here would create a small coupling; instead rely on middleware.

      // Get repositories for the entities we will touch
      const attendanceRepo = AppDataSource.getRepository(Attendance);
      const sessionRepo = AppDataSource.getRepository(Session);
      const classRepo = AppDataSource.getRepository(Class);
      const studentRepo = AppDataSource.getRepository(Student);

      // Find the class by name (case-sensitive match as stored)
      const classEntity = await classRepo.findOne({
        where: { name: className.trim() },
      });
      if (!classEntity) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Find the session by class id and date
      const session = await sessionRepo.findOne({
        where: { date, classEntity: { id: classEntity.id } as any },
      });
      if (!session) {
        return res
          .status(404)
          .json({ message: 'Session not found for the given class and date' });
      }

      // Find the student by name and email
      const student = await studentRepo.findOne({
        where: { name: studentName.trim(), email: studentEmail.trim() },
      });
      if (!student) {
        return res
          .status(404)
          .json({ message: 'Student not found with provided name and email' });
      }

      // Check uniqueness: only one attendance per student per session
      // Check uniqueness: only one attendance per student per session
      const existing = await attendanceRepo.findOne({
        where: {
          session: { id: session.id } as any,
          student: { id: student.id } as any,
        },
      });

      if (existing) {
        return res.status(409).json({
          message: 'Attendance already recorded for this student and session',
        });
      }

      // Create the attendance record with proper typing
      const attendance = attendanceRepo.create({
        status: status as AttendanceStatus,
        session: session,
        student: student,
      });

      // Persist to database
      const saved = await attendanceRepo.save(attendance);

      // Load relations for the response: include nested session relations
      const result = await attendanceRepo.findOne({
        where: { id: saved.id },
        relations: [
          'session',
          'session.classEntity',
          'session.subject',
          'session.teacher',
          'student',
        ],
      });

     
      // Return created attendance (201) with the persisted record including session.className, teacher, subject
      return res.status(201).json({ data: result });
    } catch (err) {
      // Log the error for server-side debugging and return 500
      console.error('Error creating attendance', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * PUT /attendance/:id
   * Update an existing attendance record's status by attendance id.
   */
  static async update(
    req: Request<
      { id: string },
      {},
      { status: 'present' | 'absent' | 'late' | 'excused' }
    >,
    res: Response,
  ) {
    try {
      // Validate and parse id
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ message: 'Invalid attendance id' });
      }

      // Validate status
      const { status } = req.body;
      const allowedStatuses = Object.values(AttendanceStatus);
      if (
        typeof status !== 'string' ||
        !allowedStatuses.includes(status as AttendanceStatus)
      ) {
        return res.status(400).json({
          message: `status must be one of: ${allowedStatuses.join(', ')}`,
        });
      }

      // Ensure authenticated
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      // Get attendance repository
      const attendanceRepo = AppDataSource.getRepository(Attendance);

      // Find the attendance
      const attendance = await attendanceRepo.findOne({
        where: { id },
        relations: ['session', 'student'],
      });
      if (!attendance)
        return res.status(404).json({ message: 'Attendance record not found' });

      // Update and save
      attendance.status = status as AttendanceStatus;
      const updated = await attendanceRepo.save(attendance);

      // Re-fetch with nested relations to include class, teacher and subject in the response
      const result = await attendanceRepo.findOne({
        where: { id: updated.id },
        relations: [
          'session',
          'session.classEntity',
          'session.subject',
          'session.teacher',
          'student',
        ],
      });

      return res.status(200).json({ data: result });
    } catch (err) {
      console.error('Error updating attendance', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * GET /attendance/session/:id
   * Return all attendance records for a given session id.
   */
  static async getBySession(req: Request<{ id: string }>, res: Response) {
    try {
      // Parse and validate session id from params
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ message: 'Invalid session id' });
      }

      // Ensure authenticated user exists (middleware should attach it)
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      // Use repository to fetch attendance with nested relations
      const attendanceRepo = AppDataSource.getRepository(Attendance);
      const attendances = await attendanceRepo.find({
        where: { session: { id } as any },
        relations: [
          'session',
          'session.classEntity',
          'session.subject',
          'session.teacher',
          'student',
        ],
      });

    
      // Return results (200) even if empty array
      return res.status(200).json({ data: attendances });
    } catch (err) {
      console.error('Error fetching attendance by session', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * GET /attendance/student/:id
   * Return all attendance records for a given student id.
   */
  static async getByStudent(req: Request<{ id: string }>, res: Response) {
    try {
      // Parse and validate student id
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ message: 'Invalid student id' });
      }

      // Ensure authenticated
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      // Fetch attendances for the student with nested session relations
      const attendanceRepo = AppDataSource.getRepository(Attendance);
      const attendances = await attendanceRepo.find({
        where: { student: { id } as any },
        relations: [
          'session',
          'session.classEntity',
          'session.subject',
          'session.teacher',
          'student',
        ],
      });

    

      return res.status(200).json({ data: attendances });
    } catch (err) {
      console.error('Error fetching attendance by student', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * GET /attendance/class/:id
   * Return all attendance records for a given class id (all sessions of that class).
   */
  static async getByClass(req: Request<{ id: string }>, res: Response) {
    try {
      // Parse and validate class id
      const classId = Number(req.params.id);
      if (Number.isNaN(classId) || classId <= 0) {
        return res.status(400).json({ message: 'Invalid class id' });
      }

      // Ensure authenticated
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      // Use query builder to join through session -> classEntity and filter by class id
      const attendanceRepo = AppDataSource.getRepository(Attendance);
      const attendances = await attendanceRepo
        .createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.session', 'session')
        .leftJoinAndSelect('session.classEntity', 'classEntity')
        .leftJoinAndSelect('session.subject', 'subject')
        .leftJoinAndSelect('session.teacher', 'teacher')
        .leftJoinAndSelect('attendance.student', 'student')
        .where('classEntity.id = :classId', { classId })
        .getMany();

     

      return res.status(200).json({ data: attendances });
    } catch (err) {
      console.error('Error fetching attendance by class', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default AttendanceController;
