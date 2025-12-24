import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Class } from '../entities/Class';

// Type for the body when creating/updating a class
type ClassBody = {
  name: string; // class name is required
};

/**
 * Controller that handles CRUD for `Class` entities.
 * Each function is exported as a static method so it can be used as an Express handler.
 */
export class ClassController {
  // GET /classes - list all classes with their students and sessions
  static async getAll(_req: Request, res: Response) {
    try {
      // Get repository for Class entity
      const classRepo = AppDataSource.getRepository(Class);

      // Find all classes including relations to students and sessions
      const classes = await classRepo.find({ relations: ['students', 'sessions'] });

      // Return JSON with the data and 200 OK
      return res.status(200).json({ data: classes });
    } catch (err) {
      // On unexpected error, log and return 500
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // GET /classes/:id - get one class by id with relations
  static async getById(req: Request<{ id: string }>, res: Response) {
    try {
      // Parse id param as number
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid id parameter' });
      }

      const classRepo = AppDataSource.getRepository(Class);

      // Find one class including students and sessions
      const classEntity = await classRepo.findOne({ where: { id }, relations: ['students', 'sessions'] });

      if (!classEntity) {
        return res.status(404).json({ message: 'Class not found' });
      }

      return res.status(200).json({ data: classEntity });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // POST /classes - create a new class (ADMIN only)
  static async create(req: Request<{}, {}, ClassBody>, res: Response) {
    try {
      // Validate request body: name is required
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Name is required' });
      }

      const classRepo = AppDataSource.getRepository(Class);

      // Create a new Class instance
      const newClass = classRepo.create({ name: name.trim() });

      // Save to DB
      const saved = await classRepo.save(newClass);

      return res.status(201).json({ data: saved });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // PUT /classes/:id - update an existing class (ADMIN only)
  static async update(req: Request<{ id: string }, {}, ClassBody>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid id parameter' });
      }

      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Name is required' });
      }

      const classRepo = AppDataSource.getRepository(Class);

      // Find existing class
      const existing = await classRepo.findOne({ where: { id } });
      if (!existing) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Update fields
      existing.name = name.trim();

      // Save changes
      const updated = await classRepo.save(existing);

      return res.status(200).json({ data: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // DELETE /classes/:id - remove a class (ADMIN only)
  static async remove(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid id parameter' });
      }

      const classRepo = AppDataSource.getRepository(Class);

      const existing = await classRepo.findOne({ where: { id } });
      if (!existing) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Remove the entity
      await classRepo.remove(existing);

      return res.status(200).json({ message: 'Class deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default ClassController;
