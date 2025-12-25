import { Router } from 'express';
import SubjectController from '../controllers/SubjectController';
import authenticate from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../entities/enums/Role';

const router = Router();

// Public routes
router.get('/', SubjectController.getAll);
router.get('/:id', SubjectController.getById);

// Protected routes (ADMIN only)
router.post(
  '/',
  authenticate,
  requireRole([UserRole.ADMIN]),
  SubjectController.create,
);
router.put(
  '/:id',
  authenticate,
  requireRole([UserRole.ADMIN]),
  SubjectController.update,
);
router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.ADMIN]),
  SubjectController.remove,
);

export default router;
