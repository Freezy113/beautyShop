import { Router } from 'express';
import * as publicController from '../controllers/publicController';

const router = Router();

router.get('/:slug', publicController.getMasterData);
router.post('/:slug/book', publicController.bookAppointment);

export default router;