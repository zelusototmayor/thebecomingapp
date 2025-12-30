import { Router } from 'express';
import { getSyncData, syncData } from '../controllers/syncController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, syncSchema } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, getSyncData);
router.post('/', authenticate, validate(syncSchema), syncData);

export default router;
