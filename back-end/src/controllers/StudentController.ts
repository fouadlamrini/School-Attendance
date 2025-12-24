import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Student } from '../entities/Student';
import { Class } from '../entities/Class';

// Body type for creating/updating a student
type StudentBody = {
  name: string; // required
  email: string; // required and unique
  className: string; // name of the Class this student belongs to (use class name instead of id)
};

/**
 * Controller for Student CRUD operations.
 * Each method handles request validation, DB operations, and returns JSON.
 */
export class StudentController {
  // GET /students - list all students with their class
  static async getAll(_req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Student);
      // load students with their class relation
      const students = await repo.find({ relations: ['classEntity'] });
      return res.status(200).json({ data: students });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // GET /students/:id - get one student by id
  static async getById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid id parameter' });
      }

      const repo = AppDataSource.getRepository(Student);
      const student = await repo.findOne({
        where: { id },
        relations: ['classEntity'],
      });
      if (!student)
        return res.status(404).json({ message: 'Student not found' });

      return res.status(200).json({ data: student });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // POST /students - create student (ADMIN only)
  static async create(req: Request<{}, {}, StudentBody>, res: Response) {
    try {
      const { name, email, className } = req.body;

      // Validation: name and email required
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Name is required' });
      }
      if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ message: 'Email is required' });
      }

      const studentRepo = AppDataSource.getRepository(Student);
      const classRepo = AppDataSource.getRepository(Class);

      // Ensure class exists by name
      if (
        !className ||
        typeof className !== 'string' ||
        className.trim() === ''
      ) {
        return res.status(400).json({ message: 'className is required' });
      }
      const classEntity = await classRepo.findOne({
        where: { name: className.trim() },
      });
      if (!classEntity) {
        return res.status(400).json({ message: 'Invalid className' });
      }

      // Check unique email
      const existing = await studentRepo.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Create and save
      const student = studentRepo.create({
        name: name.trim(),
        email: email.trim(),
        classEntity,
      });
      const saved = await studentRepo.save(student);

      return res.status(201).json({ data: saved });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // PUT /students/:id - update student (ADMIN only)
  static async update(
    req: Request<{ id: string }, {}, StudentBody>,
    res: Response,
  ) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id))
        return res.status(400).json({ message: 'Invalid id parameter' });

      const { name, email, className } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Name is required' });
      }
      if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ message: 'Email is required' });
      }

      const studentRepo = AppDataSource.getRepository(Student);
      const classRepo = AppDataSource.getRepository(Class);

      const student = await studentRepo.findOne({ where: { id } });
      if (!student)
        return res.status(404).json({ message: 'Student not found' });

      if (
        !className ||
        typeof className !== 'string' ||
        className.trim() === ''
      ) {
        return res.status(400).json({ message: 'className is required' });
      }
      const classEntity = await classRepo.findOne({
        where: { name: className.trim() },
      });
      if (!classEntity)
        return res.status(400).json({ message: 'Invalid className' });

      // Check if another student uses the same email
      const other = await studentRepo.findOne({ where: { email } });
      if (other && other.id !== id) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      student.name = name.trim();
      student.email = email.trim();
      student.classEntity = classEntity;

      const updated = await studentRepo.save(student);
      return res.status(200).json({ data: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // DELETE /students/:id - remove student (ADMIN only)
  static async remove(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id))
        return res.status(400).json({ message: 'Invalid id parameter' });

      const studentRepo = AppDataSource.getRepository(Student);
      const student = await studentRepo.findOne({ where: { id } });
      if (!student)
        return res.status(404).json({ message: 'Student not found' });

      await studentRepo.remove(student);
      return res.status(200).json({ message: 'Student deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default StudentController;
