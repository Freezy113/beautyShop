import { Router } from 'express';
import * as expensesController from '../controllers/expensesController';
import { authenticate } from '../middleware/auth';
import { validateExpense } from '../middleware/validate';

const router = Router();

router.get('/', authenticate, expensesController.getExpenses);
router.post('/', authenticate, validateExpense, expensesController.createExpense);

export default router;