import { Router } from 'express';
import { getSignals, createSignal, updateSignalFeedback } from '../controllers/signalsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, signalSchema } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, getSignals);
router.post('/', authenticate, validate(signalSchema), createSignal);
router.put('/:id/feedback', authenticate, updateSignalFeedback);

export default router;
