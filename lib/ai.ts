import { CONFIG } from '../constants/config';
import { Tone, Goal, Signal, SignalType, SignalTargetType } from '../types';
import { getTokens } from './auth';

export interface ReframingResult {
  northStar: string;
  whyItMatters: string;
}

/**
 * Transforms a goal into a powerful identity-based North Star statement
 * Now calls backend API endpoint instead of OpenAI directly
 */
export async function reframeGoal(
  title: string,
  note: string,
  tone: Tone = 'gentle'
): Promise<ReframingResult> {
  try {
    const tokens = await getTokens();

    if (!tokens) {
      console.log('No auth token, using fallback');
      return generateFallbackNorthStar(title);
    }

    const response = await fetch(`${CONFIG.apiUrl}/api/ai/reframe-goal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ title, note, tone }),
    });

    if (!response.ok) {
      console.error('Backend AI error:', response.status);
      return generateFallbackNorthStar(title);
    }

    const data = await response.json();

    if (data.northStar && data.whyItMatters) {
      return {
        northStar: data.northStar,
        whyItMatters: data.whyItMatters,
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
 * Now calls backend API endpoint instead of OpenAI directly
 */
export async function generateMainMission(goals: Goal[]): Promise<string> {
  try {
    const tokens = await getTokens();

    if (!tokens) {
      console.log('No auth token, using fallback mission');
      return 'I am committed to my evolution.';
    }

    const response = await fetch(`${CONFIG.apiUrl}/api/ai/generate-mission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ goals }),
    });

    if (!response.ok) {
      return 'I am committed to my evolution.';
    }

    const data = await response.json();
    return data.mainMission || 'I am committed to my evolution.';
  } catch (error) {
    console.error('Mission generation failed:', error);
    return 'I am committed to my evolution.';
  }
}

/**
 * Generates a contextualized Evolution Signal based on goals and feedback history
 * Uses round-robin goal selection to ensure even distribution across all identities
 * 25% chance to generate identity-wide signal using mainMission
 * Now calls backend API endpoint instead of OpenAI directly
 */
export async function generateEvolutionSignal(
  goals: Goal[],
  mainMission: string,
  tone: Tone,
  feedbackHistory: Signal[]
): Promise<{ text: string; type: SignalType; targetType: SignalTargetType; targetIdentity?: string }> {
  try {
    const tokens = await getTokens();

    if (!tokens) {
      console.log('No auth token, using fallback signal');
      return generateFallbackSignal(goals);
    }

    const response = await fetch(`${CONFIG.apiUrl}/api/ai/generate-signal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ goals, mainMission, tone, feedbackHistory }),
    });

    if (!response.ok) {
      return generateFallbackSignal(goals);
    }

    const data = await response.json();
    return {
      text: data.text,
      type: data.type,
      targetType: data.targetType,
      targetIdentity: data.targetIdentity,
    };
  } catch (error) {
    console.error('Signal generation failed:', error);
    return generateFallbackSignal(goals);
  }
}

function generateFallbackSignal(
  goals: Goal[]
): { text: string; type: SignalType; targetType: SignalTargetType; targetIdentity?: string } {
  if (goals.length === 0) {
    return {
      text: 'What small choice right now would honor who you are becoming?',
      type: 'inquiry',
      targetType: 'identity',
    };
  }

  // Pick a random goal
  const randomGoal = goals[Math.floor(Math.random() * goals.length)];

  return {
    text: `What would someone who is ${randomGoal.northStar.toLowerCase().replace('i am ', '')} choose right now?`,
    type: 'inquiry',
    targetType: 'goal',
    targetIdentity: randomGoal.title,
  };
}
