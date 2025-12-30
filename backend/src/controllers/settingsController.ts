import { Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

export const getSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      `SELECT notification_frequency as "notificationFrequency",
              notification_tone as "notificationTone",
              notification_time as "notificationTime",
              notification_days as "notificationDays",
              has_onboarded as "hasOnboarded",
              main_mission as "mainMission",
              current_goal_index as "currentGoalIndex"
       FROM user_settings WHERE user_id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      // Create default settings if not exists
      const defaultSettings = await query(
        `INSERT INTO user_settings (user_id)
         VALUES ($1)
         RETURNING notification_frequency as "notificationFrequency",
                   notification_tone as "notificationTone",
                   notification_time as "notificationTime",
                   notification_days as "notificationDays",
                   has_onboarded as "hasOnboarded",
                   main_mission as "mainMission",
                   current_goal_index as "currentGoalIndex"`,
        [req.user!.userId]
      );
      res.json({ settings: defaultSettings.rows[0] });
      return;
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      notificationFrequency,
      notificationTone,
      notificationTime,
      notificationDays,
      hasOnboarded,
      mainMission,
      currentGoalIndex,
    } = req.body;

    const result = await query(
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
         updated_at = NOW()
       RETURNING notification_frequency as "notificationFrequency",
                 notification_tone as "notificationTone",
                 notification_time as "notificationTime",
                 notification_days as "notificationDays",
                 has_onboarded as "hasOnboarded",
                 main_mission as "mainMission",
                 current_goal_index as "currentGoalIndex"`,
      [
        req.user!.userId,
        notificationFrequency,
        notificationTone,
        notificationTime,
        notificationDays,
        hasOnboarded,
        mainMission,
        currentGoalIndex,
      ]
    );

    res.json({ settings: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
