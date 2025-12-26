import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UserRole } from '../entities/enums/Role';

type AuthBody = { email: string; password: string };
type RegisterBody = AuthBody & { name: string; role?: UserRole };

export class AuthController {
  // -------------------
  // REGISTER
  // -------------------
  static async register(req: Request<{}, {}, RegisterBody>, res: Response) {
    try {
      const { name, email, password, role } = req.body;

      // Validation
      if (!name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }
      if (!validator.isEmail(email)) return res.status(400).json({ message: 'Invalid email' });
      if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

      const userRepo = AppDataSource.getRepository(User);

      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) return res.status(400).json({ message: 'Email already in use' });

      const hashedPassword = await bcrypt.hash(password, 10);

      // First user becomes ADMIN automatically
      const assignedRole: UserRole = (await userRepo.count()) === 0
        ? UserRole.ADMIN
        : role || UserRole.STUDENT;

      const user = userRepo.create({ name, email, password: hashedPassword, role: assignedRole });
      const savedUser = await userRepo.save(user);

      // Return without password
      const safeUser = await userRepo.findOne({ where: { id: savedUser.id } });
      return res.status(201).json(safeUser);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // -------------------
  // LOGIN
  // -------------------
  static async login(req: Request<{}, {}, AuthBody>, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email?.trim() || !password) return res.status(400).json({ message: 'Email and password are required' });

      const userRepo = AppDataSource.getRepository(User);

      // Fetch user with password
      const userWithPassword = await userRepo
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email })
        .getOne();

      if (!userWithPassword) return res.status(400).json({ message: 'Invalid email or password' });

      const isMatch = await bcrypt.compare(password, userWithPassword.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ message: 'Authentication not configured' });

      const token = jwt.sign({ userId: userWithPassword.id, role: userWithPassword.role }, secret, { expiresIn: '7d' });

      // Return user without password
      const safeUser = await userRepo.findOne({ where: { id: userWithPassword.id } });

      return res.status(200).json({ token, user: safeUser });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default AuthController;
