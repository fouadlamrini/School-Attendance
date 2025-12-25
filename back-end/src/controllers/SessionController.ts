import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Session } from '../entities/Session';
import { Class } from '../entities/Class';
import { Subject } from '../entities/Subject';
import { User } from '../entities/User';
import { UserRole } from '../entities/enums/Role';

// Body type for creating/updating a session
type SessionBody = {
  date: string; // required ISO date (YYYY-MM-DD)
  className: string; // required - class name instead of id
  subjectName: string; // required - subject name instead of id
  teacherName?: string; // optional - teacher name instead of id; if omitted and requester is a teacher, use req.user.id
};

/**
 * Controller for managing sessions.
 * Includes validation, relation checks, and JSON responses.
 */
export class SessionController {
  // GET /sessions - list sessions with relations
  static async getAll(_req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Session);
      const sessions = await repo.find({
        relations: ['classEntity', 'subject', 'teacher'],
      });
      return res.status(200).json({ data: sessions });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // GET /sessions/:id - get single session
  static async getById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id))
        return res.status(400).json({ message: 'Invalid id parameter' });

      const repo = AppDataSource.getRepository(Session);
      const session = await repo.findOne({
        where: { id },
        relations: ['classEntity', 'subject', 'teacher'],
      });
      if (!session)
        return res.status(404).json({ message: 'Session not found' });

      return res.status(200).json({ data: session });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // POST /sessions - create session (ADMIN or TEACHER)
  static async create(req: Request<{}, {}, SessionBody>, res: Response) {
    try {
      const { date, className, subjectName, teacherName } = req.body;

      // Validate required fields
      if (
        !date ||
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {
        return res
          .status(400)
          .json({ message: 'date is required in YYYY-MM-DD format' });
      }
      if (
        !className ||
        typeof className !== 'string' ||
        className.trim() === ''
      ) {
        return res.status(400).json({ message: 'className is required' });
      }
      if (
        !subjectName ||
        typeof subjectName !== 'string' ||
        subjectName.trim() === ''
      ) {
        return res.status(400).json({ message: 'subjectName is required' });
      }

      const classRepo = AppDataSource.getRepository(Class);
      const subjectRepo = AppDataSource.getRepository(Subject);
      const userRepo = AppDataSource.getRepository(User);
      const sessionRepo = AppDataSource.getRepository(Session);

      // Ensure related entities exist by name
      const classEntity = await classRepo.findOne({
        where: { name: className.trim() },
      });
      if (!classEntity)
        return res.status(400).json({ message: 'Invalid className' });

      const subject = await subjectRepo.findOne({
        where: { name: subjectName.trim() },
      });
      if (!subject)
        return res.status(400).json({ message: 'Invalid subjectName' });

      // Determine teacher: if provided by name use it, otherwise if requester is teacher use req.user
      let teacher: User | null = null;
      if (
        teacherName &&
        typeof teacherName === 'string' &&
        teacherName.trim() !== ''
      ) {
        teacher = await userRepo.findOne({
          where: { name: teacherName.trim() },
        });
        if (!teacher)
          return res.status(400).json({ message: 'Invalid teacherName' });
      } else if (req.user && req.user.role === UserRole.TEACHER) {
        teacher = await userRepo.findOne({ where: { id: req.user.id } });
      }

      // If no teacher, still allow (could be assigned later)

      const session = sessionRepo.create({
        date,
        classEntity,
        subject,
        teacher: teacher as User,
      });
      const saved = await sessionRepo.save(session);
      const result = await sessionRepo.findOne({
        where: { id: saved.id },
        relations: ['classEntity', 'subject', 'teacher'],
      });

      return res.status(201).json({ data: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // PUT /sessions/:id - update session (ADMIN or TEACHER)
  static async update(
    req: Request<{ id: string }, {}, SessionBody>,
    res: Response,
  ) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id))
        return res.status(400).json({ message: 'Invalid id parameter' });

      const { date, className, subjectName, teacherName } = req.body;
      if (
        !date ||
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {
        return res
          .status(400)
          .json({ message: 'date is required in YYYY-MM-DD format' });
      }
      if (
        !className ||
        typeof className !== 'string' ||
        className.trim() === ''
      ) {
        return res.status(400).json({ message: 'className is required' });
      }
      if (
        !subjectName ||
        typeof subjectName !== 'string' ||
        subjectName.trim() === ''
      ) {
        return res.status(400).json({ message: 'subjectName is required' });
      }

      const sessionRepo = AppDataSource.getRepository(Session);
      const classRepo = AppDataSource.getRepository(Class);
      const subjectRepo = AppDataSource.getRepository(Subject);
      const userRepo = AppDataSource.getRepository(User);

      const session = await sessionRepo.findOne({ where: { id } });
      if (!session)
        return res.status(404).json({ message: 'Session not found' });

      const classEntity = await classRepo.findOne({
        where: { name: className.trim() },
      });
      if (!classEntity)
        return res.status(400).json({ message: 'Invalid className' });

      const subject = await subjectRepo.findOne({
        where: { name: subjectName.trim() },
      });
      if (!subject)
        return res.status(400).json({ message: 'Invalid subjectName' });

      let teacher: User | null = null;
      if (
        teacherName &&
        typeof teacherName === 'string' &&
        teacherName.trim() !== ''
      ) {
        teacher = await userRepo.findOne({
          where: { name: teacherName.trim() },
        });
        if (!teacher)
          return res.status(400).json({ message: 'Invalid teacherName' });
      } else if (req.user && req.user.role === UserRole.TEACHER) {
        teacher = await userRepo.findOne({ where: { id: req.user.id } });
      }

      session.date = date;
      session.classEntity = classEntity;
      session.subject = subject;
      session.teacher = teacher as User;

      const updated = await sessionRepo.save(session);
      const result = await sessionRepo.findOne({
        where: { id: updated.id },
        relations: ['classEntity', 'subject', 'teacher'],
      });

      return res.status(200).json({ data: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // DELETE /sessions/:id - remove session (ADMIN or TEACHER)
  static async remove(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id))
        return res.status(400).json({ message: 'Invalid id parameter' });

      const sessionRepo = AppDataSource.getRepository(Session);
      const session = await sessionRepo.findOne({ where: { id } });
      if (!session)
        return res.status(404).json({ message: 'Session not found' });

      await sessionRepo.remove(session);
      return res.status(200).json({ message: 'Session deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default SessionController;
