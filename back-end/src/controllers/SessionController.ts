import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Session } from '../entities/Session';
import { Class } from '../entities/Class';
import { Subject } from '../entities/Subject';
import { User } from '../entities/User';
import { UserRole } from '../entities/enums/Role';

type SessionBody = {
  date: string;
  className: string;
  subjectName: string;
  teacherName?: string;
};

export class SessionController {
  // Helper: find class, subject, teacher by name
  private static async findRelations(body: SessionBody, reqUser?: User) {
    const classRepo = AppDataSource.getRepository(Class);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const userRepo = AppDataSource.getRepository(User);

    const classEntity = await classRepo.findOne({ where: { name: body.className.trim() } });
    if (!classEntity) throw new Error('Invalid className');

    const subject = await subjectRepo.findOne({ where: { name: body.subjectName.trim() } });
    if (!subject) throw new Error('Invalid subjectName');

    let teacher: User | null = null;
    if (body.teacherName?.trim()) {
      teacher = await userRepo.findOne({ where: { name: body.teacherName.trim() } });
      if (!teacher) throw new Error('Invalid teacherName');
    } else if (reqUser?.role === UserRole.TEACHER) {
      teacher = await userRepo.findOne({ where: { id: reqUser.id } });
    }

    return { classEntity, subject, teacher };
  }

  // GET /sessions
  static async getAll(_req: Request, res: Response) {
    try {
      const sessions = await AppDataSource.getRepository(Session).find({
        relations: ['classEntity', 'subject', 'teacher'],
      });
      return res.status(200).json({ data: sessions });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // GET /sessions/:id
  static async getById(req: Request<{ id: string }>, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

    try {
      const session = await AppDataSource.getRepository(Session).findOne({
        where: { id },
        relations: ['classEntity', 'subject', 'teacher'],
      });
      if (!session) return res.status(404).json({ message: 'Session not found' });
      return res.status(200).json({ data: session });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // POST /sessions
  static async create(req: Request<{}, {}, SessionBody>, res: Response) {
    try {
      const { date } = req.body;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
        return res.status(400).json({ message: 'date is required in YYYY-MM-DD format' });

      const { classEntity, subject, teacher } = await SessionController.findRelations(req.body, req.user);

      const sessionRepo = AppDataSource.getRepository(Session);
      const saved = await sessionRepo.save(sessionRepo.create({ date, classEntity, subject, teacher: teacher as User }));

      const result = await sessionRepo.findOne({ where: { id: saved.id }, relations: ['classEntity', 'subject', 'teacher'] });
      return res.status(201).json({ data: result });
    } catch (err: any) {
      console.error(err);
      const message = err.message || 'Internal server error';
      return res.status(400).json({ message });
    }
  }

  // PUT /sessions/:id
  static async update(req: Request<{ id: string }, {}, SessionBody>, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

    try {
      const { date } = req.body;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
        return res.status(400).json({ message: 'date is required in YYYY-MM-DD format' });

      const sessionRepo = AppDataSource.getRepository(Session);
      const session = await sessionRepo.findOne({ where: { id } });
      if (!session) return res.status(404).json({ message: 'Session not found' });

      const { classEntity, subject, teacher } = await SessionController.findRelations(req.body, req.user);

      session.date = date;
      session.classEntity = classEntity;
      session.subject = subject;
      session.teacher = teacher as User;

      const updated = await sessionRepo.save(session);
      const result = await sessionRepo.findOne({ where: { id: updated.id }, relations: ['classEntity', 'subject', 'teacher'] });
      return res.status(200).json({ data: result });
    } catch (err: any) {
      console.error(err);
      const message = err.message || 'Internal server error';
      return res.status(400).json({ message });
    }
  }

  // DELETE /sessions/:id
  static async remove(req: Request<{ id: string }>, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

    try {
      const sessionRepo = AppDataSource.getRepository(Session);
      const session = await sessionRepo.findOne({ where: { id } });
      if (!session) return res.status(404).json({ message: 'Session not found' });

      await sessionRepo.remove(session);
      return res.status(200).json({ message: 'Session deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default SessionController;
