import { Router } from 'express';
import StudentController from '../controllers/StudentController';
import authenticate from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../entities/enums/Role';

const router = Router();

// Public routes
router.get('/', StudentController.getAll);
router.get('/:id', StudentController.getById);

// Protected routes (ADMIN only)
router.post(
  '/',
  authenticate,
  requireRole([UserRole.ADMIN]),
  StudentController.create,
);
router.put(
  '/:id',
  authenticate,
  requireRole([UserRole.ADMIN]),
  StudentController.update,
);
router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.ADMIN]),
  StudentController.remove,
);

export default router;
