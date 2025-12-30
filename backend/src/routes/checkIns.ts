import { Router } from 'express';
import { getCheckIns, createCheckIn } from '../controllers/checkInsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, checkInSchema } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, getCheckIns);
router.post('/', authenticate, validate(checkInSchema), createCheckIn);

export default router;
