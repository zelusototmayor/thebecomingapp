import { Response, NextFunction } from 'express';
import { query, getClient } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

export const getSyncData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Fetch all data in parallel
    const [goalsResult, checkInsResult, signalsResult, settingsResult] = await Promise.all([
      query(
        `SELECT id, title, note, importance, north_star as "northStar",
                why_it_matters as "whyItMatters", created_at as "createdAt"
         FROM goals WHERE user_id = $1 ORDER BY created_at ASC`,
        [userId]
      ),
      query(
        `SELECT id, type, goal_id as "goalId", date, response, reflection
         FROM check_ins WHERE user_id = $1 ORDER BY date DESC`,
        [userId]
      ),
      query(
        `SELECT id, text, timestamp, type, feedback,
                target_type as "targetType", target_identity as "targetIdentity"
         FROM signals WHERE user_id = $1 ORDER BY timestamp DESC`,
        [userId]
      ),
      query(
        `SELECT notification_frequency as "notificationFrequency",
                notification_tone as "notificationTone",
                notification_time as "notificationTime",
                notification_days as "notificationDays",
                has_onboarded as "hasOnboarded",
                main_mission as "mainMission",
                current_goal_index as "currentGoalIndex"
         FROM user_settings WHERE user_id = $1`,
        [userId]
      ),
    ]);

    res.json({
      goals: goalsResult.rows,
      checkIns: checkInsResult.rows,
      signals: signalsResult.rows,
      settings: settingsResult.rows[0] || {
        notificationFrequency: 2,
        notificationTone: 'gentle',
        notificationTime: '10:00',
        notificationDays: ['Mon', 'Wed', 'Fri'],
        hasOnboarded: false,
        mainMission: '',
        currentGoalIndex: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const syncData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const client = await getClient();

  try {
    const userId = req.user!.userId;
    const { goals, checkIns, signals, settings, mainMission, currentGoalIndex } = req.body;

    await client.query('BEGIN');

    // Sync goals - upsert approach
    if (goals && goals.length > 0) {
      for (const goal of goals) {
        await client.query(
          `INSERT INTO goals (id, user_id, title, note, importance, north_star, why_it_matters, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             note = EXCLUDED.note,
             importance = EXCLUDED.importance,
             north_star = EXCLUDED.north_star,
             why_it_matters = EXCLUDED.why_it_matters,
             updated_at = NOW()`,
          [goal.id, userId, goal.title, goal.note || '', goal.importance, goal.northStar, goal.whyItMatters, goal.createdAt]
        );
      }
    }

    // Sync check-ins - upsert approach
    if (checkIns && checkIns.length > 0) {
      for (const checkIn of checkIns) {
        await client.query(
          `INSERT INTO check_ins (id, user_id, type, goal_id, date, response, reflection)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             type = EXCLUDED.type,
             goal_id = EXCLUDED.goal_id,
             response = EXCLUDED.response,
             reflection = EXCLUDED.reflection`,
          [checkIn.id, userId, checkIn.type, checkIn.goalId, checkIn.date, checkIn.response, checkIn.reflection || '']
        );
      }
    }

    // Sync signals - upsert approach
    if (signals && signals.length > 0) {
      for (const signal of signals) {
        await client.query(
          `INSERT INTO signals (id, user_id, text, timestamp, type, feedback, target_type, target_identity)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             text = EXCLUDED.text,
             feedback = EXCLUDED.feedback,
             target_type = EXCLUDED.target_type,
             target_identity = EXCLUDED.target_identity`,
          [signal.id, userId, signal.text, signal.timestamp, signal.type, signal.feedback || 'none', signal.targetType, signal.targetIdentity]
        );
      }
    }

    // Sync settings
    if (settings || mainMission !== undefined || currentGoalIndex !== undefined) {
      await client.query(
        `INSERT INTO user_settings (user_id, notification_frequency, notification_tone,
                                    notification_time, notification_days, has_onboarded,
                                    main_mission, current_goal_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
           notification_frequency = COALESCE($2, user_settings.notification_frequency),
           notification_tone = COALESCE($3, user_settings.notification_tone),
           notification_time = COALESCE($4, user_settings.notification_time),
           notification_days = COALESCE($5, user_settings.notification_days),
           has_onboarded = COALESCE($6, user_settings.has_onboarded),
           main_mission = COALESCE($7, user_settings.main_mission),
           current_goal_index = COALESCE($8, user_settings.current_goal_index),
           updated_at = NOW()`,
        [
          userId,
          settings?.notificationFrequency,
          settings?.notificationTone,
          settings?.notificationTime,
          settings?.notificationDays,
          settings?.hasOnboarded,
          mainMission,
          currentGoalIndex,
        ]
      );
    }

    await client.query('COMMIT');

    // Return synced data
    const [goalsResult, checkInsResult, signalsResult, settingsResult] = await Promise.all([
      query(
        `SELECT id, title, note, importance, north_star as "northStar",
                why_it_matters as "whyItMatters", created_at as "createdAt"
         FROM goals WHERE user_id = $1 ORDER BY created_at ASC`,
        [userId]
      ),
      query(
        `SELECT id, type, goal_id as "goalId", date, response, reflection
         FROM check_ins WHERE user_id = $1 ORDER BY date DESC`,
        [userId]
      ),
      query(
        `SELECT id, text, timestamp, type, feedback,
                target_type as "targetType", target_identity as "targetIdentity"
         FROM signals WHERE user_id = $1 ORDER BY timestamp DESC`,
        [userId]
      ),
      query(
        `SELECT notification_frequency as "notificationFrequency",
                notification_tone as "notificationTone",
                notification_time as "notificationTime",
                notification_days as "notificationDays",
                has_onboarded as "hasOnboarded",
                main_mission as "mainMission",
                current_goal_index as "currentGoalIndex"
         FROM user_settings WHERE user_id = $1`,
        [userId]
      ),
    ]);

    res.json({
      message: 'Sync successful',
      goals: goalsResult.rows,
      checkIns: checkInsResult.rows,
      signals: signalsResult.rows,
      settings: settingsResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
