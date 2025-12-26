import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Subject } from '../entities/Subject';

// دالة للتحقق من وجود subject بالاسم
async function getSubjectByName(name: string, excludeId?: number): Promise<Subject | null> {
  if (!name || name.trim() === '') throw new Error('Name is required');
  const repo = AppDataSource.getRepository(Subject);
  const existing = await repo.findOne({ where: { name: name.trim() } });
  if (existing && existing.id !== excludeId) throw new Error('Subject name already in use');
  return existing;
}

export class SubjectController {
  static async getAll(_req: Request, res: Response) {
    try {
      const subjects = await AppDataSource.getRepository(Subject).find();
      return res.status(200).json({ data: subjects });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

      const subject = await AppDataSource.getRepository(Subject).findOne({ where: { id } });
      if (!subject) return res.status(404).json({ message: 'Subject not found' });

      return res.status(200).json({ data: subject });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async create(req: Request<{}, {}, { name: string }>, res: Response) {
    try {
      const { name } = req.body;
      await getSubjectByName(name); // تحقق من الاسم
      const repo = AppDataSource.getRepository(Subject);
      const subject = repo.create({ name: name.trim() });
      const saved = await repo.save(subject);
      return res.status(201).json({ data: saved });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ message: err.message || 'Internal server error' });
    }
  }

  static async update(req: Request<{ id: string }, {}, { name: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

      const { name } = req.body;
      if (!name || name.trim() === '') return res.status(400).json({ message: 'Name is required' });

      const repo = AppDataSource.getRepository(Subject);
      const subject = await repo.findOne({ where: { id } });
      if (!subject) return res.status(404).json({ message: 'Subject not found' });

      await getSubjectByName(name, id); // تحقق من الاسم بدون احتساب نفس id

      subject.name = name.trim();
      const updated = await repo.save(subject);
      return res.status(200).json({ data: updated });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ message: err.message || 'Internal server error' });
    }
  }

  static async remove(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

      const repo = AppDataSource.getRepository(Subject);
      const subject = await repo.findOne({ where: { id } });
      if (!subject) return res.status(404).json({ message: 'Subject not found' });

      await repo.remove(subject);
      return res.status(200).json({ message: 'Subject deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default SubjectController;
