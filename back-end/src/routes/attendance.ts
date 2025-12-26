import express from 'express';
import AttendanceController from '../controllers/AttendanceController';
import authenticate from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../entities/enums/Role';

const router = express.Router();

// POST /attendance - only teachers can register attendance
// Attach `authenticate` then `requireRole` to ensure only TEACHER role can hit the controller
router.post(
  '/',
  authenticate,
  requireRole([UserRole.TEACHER]),
  AttendanceController.create,
);

// PUT /attendance/:id - update attendance status (teachers only)
router.put(
  '/:id',
  authenticate,
  requireRole([UserRole.TEACHER]),
  AttendanceController.update,
);

// GET attendance by session id (admin or teacher)
router.get(
  '/session/:id',
  authenticate,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  AttendanceController.getBySession,
);

// GET attendance by student id (admin or teacher)
router.get(
  '/student/:id',
  authenticate,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  AttendanceController.getByStudent,
);

// GET attendance by class id (admin or teacher)
router.get(
  '/class/:id',
  authenticate,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  AttendanceController.getByClass,
);

export default router;
