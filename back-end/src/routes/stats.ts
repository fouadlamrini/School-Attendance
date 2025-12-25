import express from 'express';
import StatsController from '../controllers/StatsController';
import authenticate from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../entities/enums/Role';

const router = express.Router();

// GET /stats/class/:id - only ADMIN
router.get(
  '/class/:id',
  authenticate,
  requireRole([UserRole.ADMIN]),
  StatsController.getClassStats,
);

// GET /stats/student/:id - only ADMIN
router.get(
  '/student/:id',
  authenticate,
  requireRole([UserRole.ADMIN]),
  StatsController.getStudentStats,
);

export default router;
