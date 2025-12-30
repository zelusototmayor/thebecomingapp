import { Response, NextFunction } from 'express';
import { query, getClient } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, email, name, photo_url as "photoUrl", provider, created_at as "createdAt"
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, photoUrl } = req.body;

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           photo_url = COALESCE($2, photo_url),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, name, photo_url as "photoUrl", provider`,
      [name, photoUrl, req.user!.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // All related data will be cascade deleted due to foreign key constraints
    const result = await client.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    await client.query('COMMIT');

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
