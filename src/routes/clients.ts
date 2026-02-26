import { Router } from 'express';
import * as clientsController from '../controllers/clientsController';
import { authenticate } from '../middleware/auth';
import { validateClient } from '../middleware/validate';

const router = Router();

router.get('/', authenticate, clientsController.getClients);
router.post('/', authenticate, validateClient, clientsController.createClient);
router.put('/:id', authenticate, validateClient, clientsController.updateClient);

export default router;