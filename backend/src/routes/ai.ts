import { Router } from 'express';
import { reframeGoal, generateMainMission, generateEvolutionSignal } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/reframe-goal', authenticate, reframeGoal);
router.post('/generate-mission', authenticate, generateMainMission);
router.post('/generate-signal', authenticate, generateEvolutionSignal);

export default router;
