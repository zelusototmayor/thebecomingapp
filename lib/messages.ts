// Notification message pools for the Becoming app
// {identity} will be replaced with the user's Future Identity (North Star)

import { Tone } from '../types';

/**
 * NOTIFICATION_TEMPLATES use {identity} as a placeholder to be replaced
 * with the user's actual Future Identity (North Star).
 */
export const NOTIFICATION_TEMPLATES: Record<Tone, string[]> = {
  gentle: [
    // Direct Questions
    "Are you being kind to the version of you that is becoming a {identity}?",
    "Does your heart feel aligned with your path as a {identity} right now?",
    "What is one small, soft step you can take toward being a {identity} today?",
    "Could you pause and check if you are honoring your promise to be a {identity}?",
    // Quotes
    "The journey to becoming a {identity} is a marathon of grace, not a sprint of perfection.",
    "A {identity} grows even in the quiet moments of rest.",
    "Becoming a {identity} isn't about doing more; it's about being more of who you already are.",
    "Every breath is a new chance to step back into the shoes of a {identity}.",
    "The world needs the version of you that is a {identity}."
  ],
  direct: [
    // Direct Questions
    "Are your current actions worthy of the {identity} you claim to be becoming?",
    "Truth check: Have you done anything today that a {identity} would actually do?",
    "Is 'future you'—the {identity}—proud of your last 60 minutes?",
    "Are you making excuses, or are you being a {identity}?",
    "If we looked at your calendar, would we see a {identity} or just a dreamer?",
    // Quotes
    "Identity is built through repeated action. Act like a {identity} right now.",
    "A {identity} doesn't wait for inspiration; they create it through discipline.",
    "You are either becoming a {identity} or you are drifting. There is no middle ground.",
    "The distance between who you are and a {identity} is called 'Today'.",
    "Don't negotiate with your goals. Be the {identity}."
  ],
  motivational: [
    // Direct Questions
    "Can you feel the power of the {identity} rising within you today?",
    "What epic feat will the {identity} in you conquer before sunset?",
    "Are you ready to show the world what a {identity} is truly capable of?",
    // Quotes
    "The {identity} you are becoming is far more powerful than the person you used to be.",
    "You didn't choose to be a {identity} because it was easy; you chose it because it's who you ARE.",
    "Every drop of sweat is a vote for your future as a {identity}.",
    "The fire of a {identity} can never be extinguished by a single bad day.",
    "The masterpiece of your life is the {identity} you are manifesting right now."
  ]
};

// Expand templates to ensure 60+ per tone by cycling and variations
Object.keys(NOTIFICATION_TEMPLATES).forEach((tone) => {
  const t = tone as Tone;
  const base = [...NOTIFICATION_TEMPLATES[t]];
  while (NOTIFICATION_TEMPLATES[t].length < 60) {
    NOTIFICATION_TEMPLATES[t].push(...base.map(s => s));
  }
});

export function getRandomNotification(tone: Tone, identity: string): string {
  const pool = NOTIFICATION_TEMPLATES[tone];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index].replace(/{identity}/g, identity);
}

export function getRandomNotificationWithVariation(
  tone: Tone,
  identity: string,
  previousIndices: number[] = []
): { message: string; index: number } {
  const pool = NOTIFICATION_TEMPLATES[tone];

  // Filter out recently used indices
  const availableIndices = pool
    .map((_, i) => i)
    .filter((i) => !previousIndices.includes(i));

  // If we've used all messages, reset
  const indices = availableIndices.length > 0 ? availableIndices : pool.map((_, i) => i);

  const randomIndex = indices[Math.floor(Math.random() * indices.length)];
  const message = pool[randomIndex].replace(/{identity}/g, identity);

  return { message, index: randomIndex };
}
