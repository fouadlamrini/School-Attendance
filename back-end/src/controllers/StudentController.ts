import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Student } from '../entities/Student';
import { Class } from '../entities/Class';

// دالة للتحقق من class وتعيد entity أو ترمي error
async function getClassByName(className: string): Promise<Class> {
  if (!className || className.trim() === '') throw new Error('className is required');
  const classRepo = AppDataSource.getRepository(Class);
  const classEntity = await classRepo.findOne({ where: { name: className.trim() } });
  if (!classEntity) throw new Error('Invalid className');
  return classEntity;
}

// دالة للتحقق من البريد الإلكتروني الفريد
async function checkUniqueEmail(email: string, excludeId?: number) {
  if (!email || email.trim() === '') throw new Error('Email is required');
  const studentRepo = AppDataSource.getRepository(Student);
  const existing = await studentRepo.findOne({ where: { email: email.trim() } });
  if (existing && existing.id !== excludeId) throw new Error('Email already in use');
}

export class StudentController {
  static async getAll(_req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Student);
      const students = await repo.find({ relations: ['classEntity'] });
      return res.status(200).json({ data: students });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

      const repo = AppDataSource.getRepository(Student);
      const student = await repo.findOne({ where: { id }, relations: ['classEntity'] });
      if (!student) return res.status(404).json({ message: 'Student not found' });

      return res.status(200).json({ data: student });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async create(req: Request<{}, {}, { name: string; email: string; className: string }>, res: Response) {
    try {
      const { name, email, className } = req.body;
      if (!name || name.trim() === '') return res.status(400).json({ message: 'Name is required' });

      const classEntity = await getClassByName(className);
      await checkUniqueEmail(email);

      const repo = AppDataSource.getRepository(Student);
      const student = repo.create({ name: name.trim(), email: email.trim(), classEntity });
      const saved = await repo.save(student);

      return res.status(201).json({ data: saved });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ message: err.message || 'Internal server error' });
    }
  }

  static async update(req: Request<{ id: string }, {}, { name: string; email: string; className: string }>, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id parameter' });

      const { name, email, className } = req.body;
      if (!name || name.trim() === '') return res.status(400).json({ message: 'Name is required' });

      const repo = AppDataSource.getRepository(Student);
      const student = await repo.findOne({ where: { id } });
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const classEntity = await getClassByName(className);
      await checkUniqueEmail(email, id);

      student.name = name.trim();
      student.email = email.trim();
      student.classEntity = classEntity;

      const updated = await repo.save(student);
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

      const repo = AppDataSource.getRepository(Student);
      const student = await repo.findOne({ where: { id } });
      if (!student) return res.status(404).json({ message: 'Student not found' });

      await repo.remove(student);
      return res.status(200).json({ message: 'Student deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default StudentController;
