import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

type RegisterBody = {
  name: string;
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

export class AuthController {
  // -------------------
  // REGISTER
  // -------------------
  static async register(req: Request<{}, {}, RegisterBody>, res: Response) {
    try {
      const { name, email, password } = req.body;

      // Validation simple
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      const userRepo = AppDataSource.getRepository(User);

      // Vérifier si l'email existe déjà
      const existingUser: User | null = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Hash password avec bcrypt
      const hashedPassword: string = await bcrypt.hash(password, 10);

      // Créer et sauvegarder user
      const user: User = userRepo.create({ name, email, password: hashedPassword });
      const savedUser: User = await userRepo.save(user);

      // Ne pas retourner le password
      const { password: _, ...safeUser } = savedUser;

      return res.status(201).json(safeUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // -------------------
  // LOGIN
  // -------------------
  static async login(req: Request<{}, {}, LoginBody>, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const userRepo = AppDataSource.getRepository(User);
      const user: User | null = await userRepo.findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const isMatch: boolean = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const secret: string | undefined = process.env.JWT_SECRET;
      if (!secret) {
        console.error('Missing JWT_SECRET environment variable');
        return res.status(500).json({ message: 'Authentication not configured' });
      }

      const token: string = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' });

      return res.json({ token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default AuthController;
