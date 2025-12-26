import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UserRole } from '../entities/enums/Role';

// نضيفو `user` للـ Request ديال Express
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: UserRole };
    }
  }
}

/**
 * Middleware للتحقق من JWT و attach ديال `{ id, role }` للـ req.user
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('Authorization') || req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('Missing JWT_SECRET');
      return res.status(500).json({ message: 'Authentication not configured' });
    }

    const payload = jwt.verify(token, secret) as { userId?: number; role?: string };
    if (!payload?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    console.error('Authentication error', err);
    res.status(401).json({ message: 'Unauthorized' });
  }
}

export default authenticate;
