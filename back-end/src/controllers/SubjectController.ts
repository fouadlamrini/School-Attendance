import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Subject } from '../entities/Subject';

// Body type for creating/updating a subject
type SubjectBody = {
  name: string; // required
};

/**
 * Controller handling CRUD operations for `Subject`.
 * Each method validates input, performs DB ops and returns JSON responses.
 */
export class SubjectController {
  // GET /subjects - list all subjects
  static async getAll(_req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Subject);
      // fetch all subjects
      const subjects = await repo.find();
      return res.status(200).json({ data: subjects });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // GET /subjects/:id - get subject by id
  static async getById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id))
        return res.status(400).json({ message: 'Invalid id parameter' });

      const repo = AppDataSource.getRepository(Subject);
      const subject = await repo.findOne({ where: { id } });
      if (!subject)
        return res.status(404).json({ message: 'Subject not found' });

      return res.status(200).json({ data: subject });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // POST /subjects - create new subject (ADMIN only)
  static async create(req: Request<{}, {}, SubjectBody>, res: Response) {
    try {
      const { name } = req.body;

      // validate name
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Name is required' });
      }

      const repo = AppDataSource.getRepository(Subject);

      // check unique name
      const existing = await repo.findOne({ where: { name: name.trim() } });
      if (existing)
        return res.status(400).json({ message: 'Subject already exists' });

      const subject = repo.create({ name: name.trim() });
      const saved = await repo.save(subject);

      return res.status(201).json({ data: saved });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // PUT /subjects/:id - update subject (ADMIN only)
  static async update(
    req: Request<{ id: string }, {}, SubjectBody>,
    res: Response,
  ) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id))
        return res.status(400).json({ message: 'Invalid id parameter' });

      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Name is required' });
      }

      const repo = AppDataSource.getRepository(Subject);
      const subject = await repo.findOne({ where: { id } });
      if (!subject)
        return res.status(404).json({ message: 'Subject not found' });

      // check another subject with same name
      const other = await repo.findOne({ where: { name: name.trim() } });
      if (other && other.id !== id)
        return res.status(400).json({ message: 'Subject name already in use' });

      subject.name = name.trim();
      const updated = await repo.save(subject);
      return res.status(200).json({ data: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // DELETE /subjects/:id - remove subject (ADMIN only)
  static async remove(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id))
        return res.status(400).json({ message: 'Invalid id parameter' });

      const repo = AppDataSource.getRepository(Subject);
      const subject = await repo.findOne({ where: { id } });
      if (!subject)
        return res.status(404).json({ message: 'Subject not found' });

      await repo.remove(subject);
      return res.status(200).json({ message: 'Subject deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default SubjectController;
