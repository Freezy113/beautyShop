import { Router } from 'express';
import * as servicesController from '../controllers/servicesController';
import { authenticate } from '../middleware/auth';
import { validateService, validateId } from '../middleware/validate';

const router = Router();

router.get('/', authenticate, servicesController.getServices);
router.post('/', authenticate, validateService, servicesController.createService);
router.put('/:id', authenticate, validateId, validateService, servicesController.updateService);
router.delete('/:id', authenticate, validateId, servicesController.deleteService);

export default router;