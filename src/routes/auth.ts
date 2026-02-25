import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validateRegistration, validateLogin } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;