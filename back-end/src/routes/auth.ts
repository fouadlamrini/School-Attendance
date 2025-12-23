import { Router } from 'express';
import AuthController from '../controllers/AuthController';

const router = Router();

/**
 * POST /auth/register
 * Crée un nouvel utilisateur
 */
router.post('/register', AuthController.register);

/**
 * POST /auth/login
 * Authentifie un utilisateur et retourne un JWT
 */
router.post('/login', AuthController.login);

export default router;
