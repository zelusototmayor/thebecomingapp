import { Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

export const getSignals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, text, timestamp, type, feedback,
              target_type as "targetType", target_identity as "targetIdentity"
       FROM signals WHERE user_id = $1 ORDER BY timestamp DESC`,
      [req.user!.userId]
    );

    res.json({ signals: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createSignal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, text, timestamp, type, feedback, targetType, targetIdentity } = req.body;

    const result = await query(
      `INSERT INTO signals (id, user_id, text, timestamp, type, feedback, target_type, target_identity)
       VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, text, timestamp, type, feedback,
                 target_type as "targetType", target_identity as "targetIdentity"`,
      [id, req.user!.userId, text, timestamp, type, feedback || 'none', targetType, targetIdentity]
    );

    res.status(201).json({ signal: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateSignalFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const result = await query(
      `UPDATE signals SET feedback = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, text, timestamp, type, feedback,
                 target_type as "targetType", target_identity as "targetIdentity"`,
      [feedback, id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Signal not found', 404);
    }

    res.json({ signal: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
