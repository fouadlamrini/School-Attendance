import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UserRole } from '../entities/enums/Role';

// Extend Express Request type to include `user` property
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: UserRole };
    }
  }
}

/**
 * Middleware that verifies a Bearer JWT, loads the user and
 * attaches `{ id, role }` to `req.user` for downstream handlers.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Read Authorization header
    const authHeader =
      req.header('Authorization') || req.header('authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Expect format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = parts[1];

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('Missing JWT_SECRET environment variable');
      return res.status(500).json({ message: 'Authentication not configured' });
    }

    // Verify token and extract payload
    const payload = jwt.verify(token, secret) as {
      userId?: number;
      role?: string;
    };
    if (!payload || !payload.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Optionally verify user exists in DB
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Attach minimal user info to request
    req.user = { id: user.id, role: user.role };

    return next();
  } catch (err) {
    console.error('Authentication error', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export default authenticate;
