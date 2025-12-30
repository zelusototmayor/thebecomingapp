import { Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

export const getCheckIns = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, type, goal_id as "goalId", date, response, reflection
       FROM check_ins WHERE user_id = $1 ORDER BY date DESC`,
      [req.user!.userId]
    );

    res.json({ checkIns: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createCheckIn = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, type, goalId, date, response, reflection } = req.body;

    const result = await query(
      `INSERT INTO check_ins (id, user_id, type, goal_id, date, response, reflection)
       VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6, $7)
       RETURNING id, type, goal_id as "goalId", date, response, reflection`,
      [id, req.user!.userId, type, goalId, date, response, reflection || '']
    );

    res.status(201).json({ checkIn: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
