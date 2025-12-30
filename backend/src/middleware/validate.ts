import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required').max(255),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Data schemas
export const goalSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  note: z.string().optional(),
  importance: z.enum(['low', 'med', 'high']).default('med'),
  northStar: z.string(),
  whyItMatters: z.string(),
  createdAt: z.number(),
});

export const checkInSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['goal', 'identity']).default('goal'),
  goalId: z.string().uuid().nullable(),
  date: z.number(),
  response: z.enum(['yes', 'somewhat', 'no']),
  reflection: z.string().optional(),
});

export const signalSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string(),
  timestamp: z.number(),
  type: z.enum(['inquiry', 'manifesto', 'insight']),
  feedback: z.enum(['like', 'dislike', 'none']).default('none'),
  targetType: z.enum(['goal', 'identity']).default('goal'),
  targetIdentity: z.string().optional(),
});

export const settingsSchema = z.object({
  notificationFrequency: z.union([z.literal(2), z.literal(3), z.literal(7)]).default(2),
  notificationTone: z.enum(['gentle', 'direct', 'motivational']).default('gentle'),
  notificationTime: z.string().default('10:00'),
  notificationDays: z.array(z.string()).default(['Mon', 'Wed', 'Fri']),
  hasOnboarded: z.boolean().default(false),
});

export const syncSchema = z.object({
  goals: z.array(goalSchema).optional(),
  checkIns: z.array(checkInSchema).optional(),
  signals: z.array(signalSchema).optional(),
  settings: settingsSchema.optional(),
  mainMission: z.string().optional(),
  currentGoalIndex: z.number().optional(),
});
