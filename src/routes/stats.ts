import { Router } from 'express';
import * as statsController from '../controllers/statsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, statsController.getStats);

export default router;