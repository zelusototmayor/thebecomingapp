import { Router } from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goalsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, goalSchema } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, getGoals);
router.post('/', authenticate, validate(goalSchema), createGoal);
router.put('/:id', authenticate, updateGoal);
router.delete('/:id', authenticate, deleteGoal);

export default router;
