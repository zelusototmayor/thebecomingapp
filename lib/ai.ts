import { CONFIG } from '../constants/config';
import { Tone, Goal, Signal, SignalType, SignalTargetType } from '../types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export interface ReframingResult {
  northStar: string;
  whyItMatters: string;
}

/**
 * Transforms a goal into a powerful identity-based North Star statement
 */
export async function reframeGoal(
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
    const response = await fetch(CONFIG.openAiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: CONFIG.openAiModel,
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

    const data = await response.json();
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

  // Create grammatically correct identity statement based on goal structure
  let northStar: string;
  if (cleanTitle.startsWith('be ') || cleanTitle.startsWith('become ')) {
    // "be more responsible" -> "I am becoming more responsible"
    northStar = `I am ${cleanTitle.replace(/^be /, 'becoming ').replace(/^become /, 'becoming ')}.`;
  } else if (cleanTitle.includes('more ') || cleanTitle.includes('better ')) {
    // "save more money" -> "I am someone who saves more money"
    northStar = `I am someone who ${cleanTitle.replace(/^to /, '')}.`;
  } else {
    // Generic: "exercise daily" -> "I am someone who exercises daily"
    northStar = `I am someone who ${cleanTitle.replace(/^to /, '')}.`;
  }

  return {
    northStar,
    whyItMatters: `This matters because it aligns with your deepest potential. Every step you take toward this identity is a declaration of who you are becoming.`,
  };
}

/**
 * Synthesizes multiple goals into a unified main mission/manifesto
 */
export async function generateMainMission(goals: Goal[]): Promise<string> {
  const goalsSummary = goals
    .map((g) => `- ${g.northStar} (Context: ${g.note})`)
    .join('\n');

  if (!OPENAI_API_KEY) {
    console.log('No API key found, using fallback mission');
    return 'I am committed to my evolution.';
  }

  try {
    const response = await fetch(CONFIG.openAiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: CONFIG.openAiModel,
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

    const data = await response.json();
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

/**
 * Generates a contextualized Evolution Signal based on goals and feedback history
 * Uses round-robin goal selection to ensure even distribution across all identities
 * 25% chance to generate identity-wide signal using mainMission
 */
export async function generateEvolutionSignal(
  goals: Goal[],
  mainMission: string,
  tone: Tone,
  feedbackHistory: Signal[]
): Promise<{ text: string; type: SignalType; targetType: SignalTargetType; targetIdentity?: string }> {
  // Get recent signal texts to avoid repetition
  const recentSignalTexts = feedbackHistory.slice(0, 5).map((s) => s.text);

  const likes = feedbackHistory
    .filter((s) => s.feedback === 'like')
    .map((s) => s.text)
    .slice(-5);
  const dislikes = feedbackHistory
    .filter((s) => s.feedback === 'dislike')
    .map((s) => s.text)
    .slice(-5);

  // 25% chance for identity-wide signal (if mainMission exists)
  const useIdentitySignal = Math.random() < 0.25 && mainMission;

  if (useIdentitySignal) {
    return generateIdentitySignal(mainMission, tone, likes, dislikes, recentSignalTexts);
  }

  return generateGoalSignal(goals, tone, feedbackHistory, likes, dislikes, recentSignalTexts);
}

/**
 * Generates a signal targeting the overall Future Identity (mainMission)
 */
async function generateIdentitySignal(
  mainMission: string,
  tone: Tone,
  likes: string[],
  dislikes: string[],
  recentSignalTexts: string[]
): Promise<{ text: string; type: SignalType; targetType: 'identity' }> {
  if (!OPENAI_API_KEY) {
    return {
      text: 'Is this moment aligned with who you are becoming?',
      type: 'inquiry',
      targetType: 'identity',
    };
  }

  try {
    const response = await fetch(CONFIG.openAiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: CONFIG.openAiModel,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You create powerful "Signal" messages about someone's OVERALL life philosophy and future identity.

Signal types:
- "inquiry": A thought-provoking question about their overall journey
- "manifesto": An inspiring statement about their complete transformation

Rules:
- Max 120 characters
- Must be grammatically perfect
- Never mention "app" or "notification"
- Focus on their holistic identity transformation, not specific goals
- Speak as their inner wisdom or future self

Return JSON: {"text": "...", "type": "inquiry" or "manifesto"}`,
          },
          {
            role: 'user',
            content: `Create a Signal for someone whose life philosophy is: "${mainMission}"
This is about their OVERALL future identity, not a specific goal.
Tone: ${tone}
${likes.length > 0 ? `Messages user liked: ${likes.join(' | ')}` : ''}
${dislikes.length > 0 ? `Messages user disliked: ${dislikes.join(' | ')}` : ''}
${recentSignalTexts.length > 0 ? `IMPORTANT - Do NOT repeat or closely paraphrase these recent signals: ${recentSignalTexts.join(' | ')}` : ''}`,
          },
        ],
        temperature: 0.9,
        max_completion_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('API error');
    }

    const data = await response.json();
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
      text: 'Is this moment aligned with who you are becoming?',
      type: 'inquiry',
      targetType: 'identity',
    };
  }
}

/**
 * Generates a signal targeting a specific goal
 * Uses round-robin selection to ensure even distribution across goals
 */
async function generateGoalSignal(
  goals: Goal[],
  tone: Tone,
  feedbackHistory: Signal[],
  likes: string[],
  dislikes: string[],
  recentSignalTexts: string[]
): Promise<{ text: string; type: SignalType; targetType: 'goal'; targetIdentity: string }> {
  // Select goal using round-robin based on recent signal history
  const recentSignals = feedbackHistory.slice(0, goals.length);
  const recentlyUsedIdentities = recentSignals
    .filter((s) => s.targetType === 'goal')
    .map((s) => s.targetIdentity);

  // Find a goal that hasn't been used recently
  let activeIdentity = goals.find(
    (g) => !recentlyUsedIdentities.includes(g.title)
  );

  // If all goals have been used recently, pick the one used longest ago
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
      text: `Are you acting as a ${activeIdentity.title} right now?`,
      type: 'inquiry',
      targetType: 'goal',
      targetIdentity: activeIdentity.title,
    };
  }

  try {
    const response = await fetch(CONFIG.openAiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: CONFIG.openAiModel,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You create powerful "Signal" messages that remind users of their identity transformation journey.

Signal types:
- "inquiry": A thought-provoking question (e.g., "Is this choice aligned with who you're becoming?")
- "manifesto": An inspiring statement (e.g., "Your future self is built by today's decisions.")

Rules:
- Max 120 characters
- Must be grammatically perfect
- Never mention "app" or "notification"
- Speak as their inner wisdom or future self

Return JSON: {"text": "...", "type": "inquiry" or "manifesto"}`,
          },
          {
            role: 'user',
            content: `Create a Signal for someone becoming: "${activeIdentity.northStar}"
Tone: ${tone}
${likes.length > 0 ? `Messages user liked: ${likes.join(' | ')}` : ''}
${dislikes.length > 0 ? `Messages user disliked: ${dislikes.join(' | ')}` : ''}
${recentSignalTexts.length > 0 ? `IMPORTANT - Do NOT repeat or closely paraphrase these recent signals: ${recentSignalTexts.join(' | ')}` : ''}`,
          },
        ],
        temperature: 0.9,
        max_completion_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('API error');
    }

    const data = await response.json();
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
      text: `Are you acting as a ${activeIdentity.title} right now?`,
      type: 'inquiry',
      targetType: 'goal',
      targetIdentity: activeIdentity.title,
    };
  }
}
