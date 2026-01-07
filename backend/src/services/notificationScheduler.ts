import cron from 'node-cron';
import { query } from '../config/database.js';
import { sendPushNotification } from './expoPushService.js';
import { v4 as uuidv4 } from 'uuid';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

type Tone = 'gentle' | 'direct' | 'motivational';
type SignalType = 'inquiry' | 'manifesto' | 'insight';
type SignalTargetType = 'goal' | 'identity';

interface Goal {
  id: string;
  title: string;
  northStar: string;
  whyItMatters: string;
  note: string;
}

interface Signal {
  id: string;
  text: string;
  type: SignalType;
  targetType: SignalTargetType;
  targetIdentity?: string;
  feedback?: 'like' | 'dislike' | 'none';
}

const TONE_PSYCHOLOGY: Record<Tone, string> = {
  gentle: `TONE: Warm & Self-Compassionate (Kristin Neff-inspired)
- Speak like a caring inner mentor who believes in their potential
- Use self-compassion framing: motivation through caring, not inadequacy
- Acknowledge that growth includes struggle—normalize difficulty
- Support autonomy: invite reflection rather than command action
- Example energy: "What would feel like a small act of kindness toward your future self right now?"`,

  direct: `TONE: Clear & Grounded (Motivational Interviewing-inspired)
- Be honest and clear without shaming or confronting
- Evoke their own motivation rather than imposing external pressure
- Use present-moment awareness: connect THIS moment to identity
- Support competence: recognize that they have the ability to choose
- Example energy: "Right now, you get to choose. What would align with who you're becoming?"`,

  motivational: `TONE: Energizing & Identity-Affirming (James Clear-inspired)
- Reinforce that every small action is a "vote" for their identity
- Build self-efficacy: highlight their agency and capability
- Connect effort to meaning, not just outcomes
- Support relatedness: connect to their future self as someone worth showing up for
- Example energy: "This moment is a vote. Your future self is watching—what will you cast?"`,
};

const SIGNAL_CATEGORIES = `
SIGNAL CATEGORIES (choose the most psychologically appropriate):

1. "inquiry" - Evocative Question
   - Opens self-reflection without judgment
   - Uses autonomy-supportive language (invite, not command)
   - Examples: "What choice in this moment would you be proud of tonight?" or "If your future self could see you now, what would they hope you'd choose?"

2. "manifesto" - Identity Affirmation
   - Reinforces who they ARE becoming (not who they should be)
   - Uses "vote" metaphor or identity-action connection
   - Examples: "Every small choice is shaping the person you're becoming." or "You're not waiting to become this—you're already practicing being this person."

3. "insight" - Implementation Bridge
   - Connects situation to specific action (if-then framing)
   - Helps bridge intention and behavior
   - Examples: "If you're about to scroll, pause—what would serve you more?" or "Before deciding, ask: does this strengthen or weaken who I want to be?"
`;

async function generateEvolutionSignal(
  goals: Goal[],
  mainMission: string,
  tone: Tone,
  feedbackHistory: Signal[]
): Promise<{ text: string; type: SignalType; targetType: SignalTargetType; targetIdentity?: string }> {
  const recentSignalTexts = feedbackHistory.slice(0, 5).map((s) => s.text);

  const likes = feedbackHistory
    .filter((s) => s.feedback === 'like')
    .map((s) => s.text)
    .slice(-5);
  const dislikes = feedbackHistory
    .filter((s) => s.feedback === 'dislike')
    .map((s) => s.text)
    .slice(-5);

  const useIdentitySignal = Math.random() < 0.25 && mainMission;

  if (useIdentitySignal) {
    return generateIdentitySignal(mainMission, tone, likes, dislikes, recentSignalTexts);
  }

  return generateGoalSignal(goals, tone, feedbackHistory, likes, dislikes, recentSignalTexts);
}

async function generateIdentitySignal(
  mainMission: string,
  tone: Tone,
  likes: string[],
  dislikes: string[],
  recentSignalTexts: string[]
): Promise<{ text: string; type: SignalType; targetType: 'identity' }> {
  if (!OPENAI_API_KEY) {
    return {
      text: 'What small choice right now would honor who you are becoming?',
      type: 'inquiry',
      targetType: 'identity',
    };
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are crafting a brief "Signal"—a moment of inner wisdom that helps someone stay connected to their evolving identity.

PSYCHOLOGY FOUNDATION:
- Self-Determination Theory: Support autonomy (choice), competence (capability), and relatedness (connection to future self)
- Identity-Based Habits: "Every action is a vote for the type of person you wish to become"
- Self-Compassion: Motivation through caring, not criticism or shame
- Motivational Interviewing: Evoke their own reasons, never argue or confront

${TONE_PSYCHOLOGY[tone]}

${SIGNAL_CATEGORIES}

CRITICAL RULES:
- Maximum 120 characters
- Must be grammatically flawless
- NEVER shame, guilt, or use fear ("Are you making excuses?" = BAD)
- NEVER use hollow hype or clichés ("You've got this!" = BAD)
- NEVER mention "app", "notification", or "reminder"
- Speak as their wisest inner voice, not an external coach
- Make them FEEL something—curiosity, warmth, or quiet determination

VARIETY GUIDELINES:
- Rotate signal types: aim for roughly 40% inquiry, 35% manifesto, 25% insight
- Vary sentence structures—avoid starting with "What" every time
- For manifesto: use declarative statements that affirm identity
- For insight: use "if-then" or situational framing

Return JSON: {"text": "...", "type": "inquiry" or "manifesto" or "insight"}`,
          },
          {
            role: 'user',
            content: `Create a Signal for someone whose life philosophy is: "${mainMission}"

This is about their HOLISTIC identity transformation, not a specific goal.

${likes.length > 0 ? `Signals they resonated with (learn from these): ${likes.join(' | ')}` : ''}
${dislikes.length > 0 ? `Signals that didn't land (avoid this style): ${dislikes.join(' | ')}` : ''}
${recentSignalTexts.length > 0 ? `AVOID repeating or closely paraphrasing: ${recentSignalTexts.join(' | ')}` : ''}`,
          },
        ],
        temperature: 0.85,
        max_completion_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('API error');
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content');
    }

    const result = JSON.parse(content);
    return {
      text: result.text,
      type: result.type as SignalType,
      targetType: 'identity',
    };
  } catch (error) {
    console.error('Identity signal generation failed:', error);
    return {
      text: 'What small choice right now would honor who you are becoming?',
      type: 'inquiry',
      targetType: 'identity',
    };
  }
}

async function generateGoalSignal(
  goals: Goal[],
  tone: Tone,
  feedbackHistory: Signal[],
  likes: string[],
  dislikes: string[],
  recentSignalTexts: string[]
): Promise<{ text: string; type: SignalType; targetType: 'goal'; targetIdentity: string }> {
  const recentSignals = feedbackHistory.slice(0, goals.length);
  const recentlyUsedIdentities = recentSignals
    .filter((s) => s.targetType === 'goal')
    .map((s) => s.targetIdentity || '');

  let activeIdentity = goals.find(
    (g) => !recentlyUsedIdentities.includes(g.title)
  );

  if (!activeIdentity) {
    const goalsByRecency = goals.slice().sort((a, b) => {
      const aIndex = recentlyUsedIdentities.indexOf(a.title);
      const bIndex = recentlyUsedIdentities.indexOf(b.title);
      return bIndex - aIndex;
    });
    activeIdentity = goalsByRecency[0];
  }

  if (!OPENAI_API_KEY) {
    return {
      text: `What would someone who is ${activeIdentity.title} choose right now?`,
      type: 'inquiry',
      targetType: 'goal',
      targetIdentity: activeIdentity.title,
    };
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are crafting a brief "Signal"—a moment of inner wisdom that helps someone embody a specific identity they are growing into.

PSYCHOLOGY FOUNDATION:
- Self-Determination Theory: Support autonomy (choice), competence (capability), and relatedness (connection to future self)
- Identity-Based Habits: "Every action is a vote for the type of person you wish to become"
- Self-Compassion: Motivation through caring, not criticism or shame
- Motivational Interviewing: Evoke their own reasons, never argue or confront
- Implementation Intentions: Help them connect situations to identity-aligned responses

${TONE_PSYCHOLOGY[tone]}

${SIGNAL_CATEGORIES}

CRITICAL RULES:
- Maximum 120 characters
- Must be grammatically flawless
- NEVER shame, guilt, or use fear ("Are you making excuses?" = BAD)
- NEVER use hollow hype or clichés ("You've got this!" = BAD)
- NEVER mention "app", "notification", or "reminder"
- Speak as their wisest inner voice, not an external coach
- Connect the message specifically to the identity they're embodying
- Make them FEEL something—curiosity, warmth, or quiet determination

VARIETY GUIDELINES:
- Rotate signal types: aim for roughly 40% inquiry, 35% manifesto, 25% insight
- Vary sentence structures—avoid starting with "What" every time
- For manifesto: use declarative statements that affirm identity
- For insight: use "if-then" or situational framing ("If you're about to..., pause and...")

Return JSON: {"text": "...", "type": "inquiry" or "manifesto" or "insight"}`,
          },
          {
            role: 'user',
            content: `Create a Signal for someone whose identity statement is: "${activeIdentity.northStar}"

Their deeper motivation: "${activeIdentity.whyItMatters}"

${likes.length > 0 ? `Signals they resonated with (learn from these): ${likes.join(' | ')}` : ''}
${dislikes.length > 0 ? `Signals that didn't land (avoid this style): ${dislikes.join(' | ')}` : ''}
${recentSignalTexts.length > 0 ? `AVOID repeating or closely paraphrasing: ${recentSignalTexts.join(' | ')}` : ''}`,
          },
        ],
        temperature: 0.85,
        max_completion_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('API error');
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content');
    }

    const result = JSON.parse(content);
    return {
      text: result.text,
      type: result.type as SignalType,
      targetType: 'goal',
      targetIdentity: activeIdentity.title,
    };
  } catch (error) {
    console.error('Goal signal generation failed:', error);
    return {
      text: `What would someone who is ${activeIdentity.title} choose right now?`,
      type: 'inquiry',
      targetType: 'goal',
      targetIdentity: activeIdentity.title,
    };
  }
}

async function processScheduledNotifications() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
  const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

  console.log(`[Scheduler] Checking notifications for ${currentTime} on ${currentDay}`);

  try {
    // Find users who should receive notifications now
    const result = await query(
      `
      SELECT
        u.id as user_id,
        u.name,
        s.notification_tone,
        s.notification_time,
        s.notification_days,
        s.main_mission,
        s.current_goal_index,
        p.push_token
      FROM users u
      JOIN user_settings s ON u.id = s.user_id
      JOIN expo_push_tokens p ON u.id = p.user_id
      WHERE s.notification_time = $1
        AND $2 = ANY(s.notification_days)
        AND s.has_onboarded = true
      `,
      [currentTime, currentDay]
    );

    if (result.rows.length === 0) {
      console.log('[Scheduler] No users need notifications at this time');
      return;
    }

    console.log(`[Scheduler] Found ${result.rows.length} user(s) to notify`);

    for (const user of result.rows) {
      try {
        // Fetch user's goals
        const goalsResult = await query(
          'SELECT id, title, north_star as "northStar", why_it_matters as "whyItMatters", note FROM goals WHERE user_id = $1 ORDER BY created_at ASC',
          [user.user_id]
        );

        const goals: Goal[] = goalsResult.rows;

        if (goals.length === 0 && !user.main_mission) {
          console.log(`[Scheduler] User ${user.name} has no goals or main mission, skipping`);
          continue;
        }

        // Fetch recent signals for feedback history
        const signalsResult = await query(
          `SELECT id, text, type, target_type as "targetType", target_identity as "targetIdentity", feedback
           FROM signals
           WHERE user_id = $1
           ORDER BY timestamp DESC
           LIMIT 20`,
          [user.user_id]
        );

        const signals: Signal[] = signalsResult.rows.map((row) => ({
          id: row.id,
          text: row.text,
          type: row.type,
          targetType: row.targetType,
          targetIdentity: row.targetIdentity,
          feedback: row.feedback || 'none',
        }));

        // Generate AI signal
        console.log(`[Scheduler] Generating AI signal for ${user.name}`);
        const signal = await generateEvolutionSignal(
          goals,
          user.main_mission || '',
          user.notification_tone as Tone,
          signals
        );

        // Save signal to database
        const signalId = uuidv4();
        const timestamp = Date.now();

        await query(
          `INSERT INTO signals (id, user_id, text, timestamp, type, target_type, target_identity, feedback)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            signalId,
            user.user_id,
            signal.text,
            timestamp,
            signal.type,
            signal.targetType,
            signal.targetIdentity || null,
            'none',
          ]
        );

        console.log(`[Scheduler] Signal saved to database: ${signalId}`);

        // Send push notification
        const success = await sendPushNotification(
          user.push_token,
          'The Becoming',
          signal.text,
          {
            type: 'scheduled_signal',
            signalId,
            text: signal.text,
            signalType: signal.type,
            targetType: signal.targetType,
            targetIdentity: signal.targetIdentity || '',
            timestamp,
          }
        );

        if (success) {
          console.log(`[Scheduler] Push notification sent to ${user.name}`);
        } else {
          console.error(`[Scheduler] Failed to send push notification to ${user.name}`);
        }
      } catch (error) {
        console.error(`[Scheduler] Error processing notification for user ${user.name}:`, error);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error in processScheduledNotifications:', error);
  }
}

export function startNotificationScheduler() {
  console.log('[Scheduler] Starting notification scheduler (runs every minute)');

  // Run every minute
  cron.schedule('* * * * *', () => {
    processScheduledNotifications();
  });

  console.log('[Scheduler] Notification scheduler initialized');
}
