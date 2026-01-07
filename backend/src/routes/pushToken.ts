import { Router } from 'express';
import { registerPushToken, unregisterPushToken } from '../controllers/pushTokenController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', authenticate, registerPushToken);
router.delete('/unregister', authenticate, unregisterPushToken);

export default router;
