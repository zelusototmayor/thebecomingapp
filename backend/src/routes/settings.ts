import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, settingsSchema } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, validate(settingsSchema), updateSettings);

export default router;
