import { Router } from 'express';
import * as appointmentsController from '../controllers/appointmentsController';
import { authenticate } from '../middleware/auth';
import { validateAppointment, validateId } from '../middleware/validate';

const router = Router();

router.get('/', authenticate, appointmentsController.getAppointments);
router.put('/:id', authenticate, validateId, validateAppointment, appointmentsController.updateAppointment);

export default router;