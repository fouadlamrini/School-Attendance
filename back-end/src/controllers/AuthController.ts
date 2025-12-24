import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UserRole } from '../entities/enums/Role';

type RegisterBody = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

type LoginBody = {
  email: string;
  password: string;
  role?: UserRole;
};

export class AuthController {
  // -------------------
  // REGISTER
  // -------------------
  static async register(req: Request<{}, {}, RegisterBody>, res: Response) {
    try {
      const { name, email, password, role } = req.body;

      // Validation simple
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ message: 'Name, email and password are required' });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email' });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: 'Password must be at least 6 characters' });
      }

      const userRepo = AppDataSource.getRepository(User);

      const existingUser: User | null = await userRepo.findOne({
        where: { email },
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Hash password
      const hashedPassword: string = await bcrypt.hash(password, 10);

      // Déterminer le rôle
      const usersCount = await userRepo.count();
      let assignedRole: UserRole;
      if (usersCount === 0) {
        assignedRole = UserRole.ADMIN; // premier user devient admin
      } else {
        assignedRole = role || UserRole.STUDENT; // sinon role du body ou default STUDENT
      }

      // Créer user
      const user: User = userRepo.create({
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
      });

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
        return res
          .status(400)
          .json({ message: 'Email and password are required' });
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
        return res
          .status(500)
          .json({ message: 'Authentication not configured' });
      }

      const token: string = jwt.sign(
        { userId: user.id, role: user.role },
        secret,
        { expiresIn: '7d' },
      );

      // Remove password before returning user object
      const { password: _pwd, ...safeUser } = user;

      // Return both token and sanitized user
      return res.status(200).json({ token, user: safeUser });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default AuthController;
