import { Request, Response, NextFunction } from 'express';

// Définir un type pour l'objet user attaché à req
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: 'admin' | 'teacher' | 'student';
  };
}

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param allowedRoles liste des rôles autorisés
 */
export function requireRole(allowedRoles: ('admin' | 'teacher' | 'student')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    next();
  };
}
