import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { query } from '../config/database.js';

export const registerPushToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { pushToken, deviceId, platform } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!pushToken) {
      res.status(400).json({ error: 'Push token is required' });
      return;
    }

    // Upsert push token (insert or update if exists)
    await query(
      `INSERT INTO expo_push_tokens (user_id, push_token, device_id, platform, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         push_token = EXCLUDED.push_token,
         device_id = EXCLUDED.device_id,
         platform = EXCLUDED.platform,
         updated_at = NOW()`,
      [userId, pushToken, deviceId || null, platform || null]
    );

    console.log(`Push token registered for user ${userId}`);
    res.json({ success: true, message: 'Push token registered successfully' });
  } catch (error) {
    next(error);
  }
};

export const unregisterPushToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await query('DELETE FROM expo_push_tokens WHERE user_id = $1', [userId]);

    console.log(`Push token unregistered for user ${userId}`);
    res.json({ success: true, message: 'Push token unregistered successfully' });
  } catch (error) {
    next(error);
  }
};
