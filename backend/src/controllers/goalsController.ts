import { Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

export const getGoals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, title, note, importance, north_star as "northStar",
              why_it_matters as "whyItMatters", created_at as "createdAt"
       FROM goals WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.user!.userId]
    );

    res.json({ goals: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, title, note, importance, northStar, whyItMatters, createdAt } = req.body;

    const result = await query(
      `INSERT INTO goals (id, user_id, title, note, importance, north_star, why_it_matters, created_at)
       VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, note, importance, north_star as "northStar",
                 why_it_matters as "whyItMatters", created_at as "createdAt"`,
      [id, req.user!.userId, title, note || '', importance, northStar, whyItMatters, createdAt]
    );

    res.status(201).json({ goal: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, note, importance, northStar, whyItMatters } = req.body;

    // Verify ownership
    const existing = await query(
      `SELECT id FROM goals WHERE id = $1 AND user_id = $2`,
      [id, req.user!.userId]
    );

    if (existing.rows.length === 0) {
      throw new AppError('Goal not found', 404);
    }

    const result = await query(
      `UPDATE goals
       SET title = COALESCE($1, title),
           note = COALESCE($2, note),
           importance = COALESCE($3, importance),
           north_star = COALESCE($4, north_star),
           why_it_matters = COALESCE($5, why_it_matters),
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id, title, note, importance, north_star as "northStar",
                 why_it_matters as "whyItMatters", created_at as "createdAt"`,
      [title, note, importance, northStar, whyItMatters, id, req.user!.userId]
    );

    res.json({ goal: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Goal not found', 404);
    }

    res.json({ message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};
