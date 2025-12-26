import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Class } from '../entities/Class';

type ClassBody = { name: string };

export class ClassController {
  static async getAll(_req: Request, res: Response) {
    try {
      const classes = await AppDataSource.getRepository(Class).find({
        relations: ['students', 'sessions'],
      });
      return res.status(200).json({ data: classes });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getById(req: Request<{ id: string }>, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

    try {
      const classEntity = await AppDataSource.getRepository(Class).findOne({
        where: { id },
        relations: ['students', 'sessions'],
      });
      if (!classEntity) return res.status(404).json({ message: 'Class not found' });
      return res.status(200).json({ data: classEntity });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async create(req: Request<{}, {}, ClassBody>, res: Response) {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Name is required' });

    try {
      const saved = await AppDataSource.getRepository(Class).save(
        AppDataSource.getRepository(Class).create({ name })
      );
      return res.status(201).json({ data: saved });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async update(req: Request<{ id: string }, {}, ClassBody>, res: Response) {
    const id = Number(req.params.id);
    const name = req.body.name?.trim();
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });
    if (!name) return res.status(400).json({ message: 'Name is required' });

    try {
      const classRepo = AppDataSource.getRepository(Class);
      const existing = await classRepo.findOne({ where: { id } });
      if (!existing) return res.status(404).json({ message: 'Class not found' });

      existing.name = name;
      const updated = await classRepo.save(existing);
      return res.status(200).json({ data: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async remove(req: Request<{ id: string }>, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

    try {
      const classRepo = AppDataSource.getRepository(Class);
      const existing = await classRepo.findOne({ where: { id } });
      if (!existing) return res.status(404).json({ message: 'Class not found' });

      await classRepo.remove(existing);
      return res.status(200).json({ message: 'Class deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default ClassController;
