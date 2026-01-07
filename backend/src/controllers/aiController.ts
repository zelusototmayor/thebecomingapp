import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface ReframingResult {
  northStar: string;
  whyItMatters: string;
}

type Tone = 'gentle' | 'direct' | 'motivational';
type SignalType = 'inquiry' | 'manifesto' | 'insight';
type SignalTargetType = 'goal' | 'identity';

interface Goal {
  id?: string;
  title: string;
  northStar: string;
  whyItMatters: string;
  note: string;
}

interface Signal {
  id?: string;
  text: string;
  type: SignalType;
  targetType: SignalTargetType;
  targetIdentity?: string;
  feedback?: 'like' | 'dislike';
  createdAt?: Date;
}

/**
 * POST /api/ai/reframe-goal
 * Transforms a goal into a powerful identity-based North Star statement
 */
export const reframeGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, note, tone = 'gentle' } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const result = await reframeGoalInternal(title, note || '', tone as Tone);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/generate-mission
 * Synthesizes multiple goals into a unified main mission/manifesto
 */
export const generateMainMission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { goals } = req.body;

    if (!goals || !Array.isArray(goals)) {
      res.status(400).json({ error: 'Goals array is required' });
      return;
    }

    const mainMission = await generateMainMissionInternal(goals);
    res.json({ mainMission });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/generate-signal
 * Generates a contextualized Evolution Signal based on goals and feedback history
 */
export const generateEvolutionSignal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { goals, mainMission, tone, feedbackHistory } = req.body;

    if (!goals || !Array.isArray(goals)) {
      res.status(400).json({ error: 'Goals array is required' });
      return;
    }

    const signal = await generateEvolutionSignalInternal(
      goals,
      mainMission || '',
      tone || 'gentle',
      feedbackHistory || []
    );
    res.json(signal);
  } catch (error) {
    next(error);
  }
};

// Internal helper functions

async function reframeGoalInternal(
  title: string,
  note: string,
  tone: Tone = 'gentle'
): Promise<ReframingResult> {
  const toneInstruction = {
    gentle: 'supportive, warm, and soft',
    direct: 'clear, concise, and honest (no fluff)',
    motivational: 'high-energy, inspiring, and empowering',
  }[tone];

  if (!OPENAI_API_KEY) {
    console.log('No API key found, using fallback');
    return generateFallbackNorthStar(title);
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
            content: `You are a transformational identity coach who helps people reframe goals as identity statements.

Your task: Transform the user's goal into a powerful "North Star" identity statement.

Rules for the North Star:
- Must be grammatically perfect English
- Must start with "I am" followed by an identity (e.g., "I am someone who...", "I am a person who...", "I am becoming...")
- Must be exactly ONE sentence, max 15 words
- Must feel aspirational yet achievable

Rules for Why It Matters:
- 2-3 sentences explaining the deeper meaning
- Match the requested tone
- Connect to personal growth and transformation

Return JSON: {"northStar": "...", "whyItMatters": "..."}`,
          },
          {
            role: 'user',
            content: `Goal: "${title}"
Context: "${note || 'No additional context provided'}"
Tone: ${toneInstruction}`,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return generateFallbackNorthStar(title);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return generateFallbackNorthStar(title);
    }

    const parsed = JSON.parse(content);

    if (parsed.northStar && parsed.whyItMatters) {
      return {
        northStar: parsed.northStar,
        whyItMatters: parsed.whyItMatters,
      };
    }

    return generateFallbackNorthStar(title);
  } catch (error) {
    console.error('AI Reframing failed:', error);
    return generateFallbackNorthStar(title);
  }
}

function generateFallbackNorthStar(title: string): ReframingResult {
  const cleanTitle = title.toLowerCase().trim();

  let northStar: string;
  if (cleanTitle.startsWith('be ') || cleanTitle.startsWith('become ')) {
    northStar = `I am ${cleanTitle.replace(/^be /, 'becoming ').replace(/^become /, 'becoming ')}.`;
  } else if (cleanTitle.includes('more ') || cleanTitle.includes('better ')) {
    northStar = `I am someone who ${cleanTitle.replace(/^to /, '')}.`;
  } else {
    northStar = `I am someone who ${cleanTitle.replace(/^to /, '')}.`;
  }

  return {
    northStar,
    whyItMatters: `This matters because it aligns with your deepest potential. Every step you take toward this identity is a declaration of who you are becoming.`,
  };
}

async function generateMainMissionInternal(goals: Goal[]): Promise<string> {
  const goalsSummary = goals
    .map((g) => `- ${g.northStar} (Context: ${g.note})`)
    .join('\n');

  if (!OPENAI_API_KEY) {
    console.log('No API key found, using fallback mission');
    return 'I am committed to my evolution.';
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
            content: `You synthesize multiple identity goals into one powerful unifying life philosophy.

Rules:
- Create ONE sentence that captures the essence of all identities
- Must be inspiring and actionable
- Max 20 words
- Must be grammatically perfect

Return JSON: {"mainMission": "..."}`,
          },
          {
            role: 'user',
            content: `Synthesize these identities into one unifying philosophy:\n${goalsSummary}`,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 100,
      }),
    });

    if (!response.ok) {
      return 'I am committed to my evolution.';
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return 'I am committed to my evolution.';
    }

    const parsed = JSON.parse(content);
    return parsed.mainMission || 'I am committed to my evolution.';
  } catch (error) {
    console.error('Mission generation failed:', error);
    return 'I am committed to my evolution.';
  }
}

async function generateEvolutionSignalInternal(
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
