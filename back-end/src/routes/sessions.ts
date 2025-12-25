import { Router } from 'express';
import SessionController from '../controllers/SessionController';
import authenticate from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../entities/enums/Role';

const router = Router();

// Public routes
router.get('/', SessionController.getAll);
router.get('/:id', SessionController.getById);

// Protected routes (ADMIN and TEACHER)
router.post(
  '/',
  authenticate,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  SessionController.create,
);
router.put(
  '/:id',
  authenticate,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  SessionController.update,
);
router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  SessionController.remove,
);

export default router;
