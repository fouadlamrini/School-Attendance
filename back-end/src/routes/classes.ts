import { Router } from 'express';
import ClassController from '../controllers/ClassController';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../entities/enums/Role';
import authenticate from '../middlewares/authenticate';

// Create router instance for classes
const router = Router();

// Public route: list classes
router.get('/', ClassController.getAll);

// Public route: get one class by id
router.get('/:id', ClassController.getById);

// Protected routes: only admin can create/update/delete
router.post(
  '/',
  authenticate,
  requireRole([UserRole.ADMIN]),
  ClassController.create,
);
router.put(
  '/:id',
  authenticate,
  requireRole([UserRole.ADMIN]),
  ClassController.update,
);
router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.ADMIN]),
  ClassController.remove,
);

export default router;
