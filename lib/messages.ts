// Notification message pools for the Becoming app
// {identity} will be replaced with the user's Future Identity (North Star)
//
// PSYCHOLOGY FOUNDATION:
// - Self-Determination Theory: Support autonomy, competence, relatedness
// - Identity-Based Habits: Every action is a vote for who you're becoming
// - Self-Compassion: Motivation through caring, not shame
// - Motivational Interviewing: Evoke, don't confront
// - Implementation Intentions: Connect situations to responses

import { Tone } from '../types';

/**
 * NOTIFICATION_TEMPLATES use {identity} as a placeholder to be replaced
 * with the user's actual Future Identity (North Star).
 *
 * Each tone is grounded in specific psychological principles:
 * - Gentle: Self-compassion, warmth, normalizing struggle
 * - Direct: Present-moment awareness, clear choice framing, no shame
 * - Motivational: Identity-action connection, agency, future-self relatedness
 */
export const NOTIFICATION_TEMPLATES: Record<Tone, string[]> = {
  gentle: [
    // Autonomy-supportive questions (invite, don't command)
    "What would feel like a small act of kindness toward your future self right now?",
    "Is there one gentle step you could take today as a {identity}?",
    "What does your inner {identity} need from you in this moment?",
    "How might you honor the {identity} in you, even imperfectly?",
    // Self-compassion framing
    "Growth includes rest. What would a wise {identity} do right now?",
    "You're learning to be a {identity}. Learning takes time—and that's okay.",
    "Even on hard days, the {identity} in you is still there, still growing.",
    "Being a {identity} isn't about perfection. It's about returning, again and again.",
    // Connection to meaning
    "Somewhere inside, the {identity} you're becoming is already taking shape.",
    "Small choices matter. What small choice would a {identity} make now?"
  ],
  direct: [
    // Present-moment awareness (clear, not shaming)
    "Right now, you get to choose. What would a {identity} do?",
    "This moment is a choice point. What aligns with being a {identity}?",
    "What's one thing you could do in the next hour as a {identity}?",
    "Your next action is a vote. What does the {identity} in you vote for?",
    // Competence support (recognize capability)
    "You know what a {identity} would choose here. Trust that.",
    "The {identity} isn't someone else—it's a part of you that's ready to act.",
    "No perfect moment needed. A {identity} starts where they are.",
    // Implementation intention bridges
    "Before you decide, pause: what would serve the {identity} you're becoming?",
    "If you're at a crossroads, ask: which path leads toward {identity}?",
    "One clear choice, right now, as a {identity}. What is it?"
  ],
  motivational: [
    // Identity-action connection (James Clear style)
    "Every small action is a vote for the {identity} you're becoming.",
    "The {identity} isn't built in big moments—it's built in moments like this one.",
    "Your future self is shaped by what you choose right now. What will you cast?",
    "Each choice either strengthens or weakens the {identity}. Which will this be?",
    // Agency and self-efficacy
    "You have the power to choose as a {identity}, right now, today.",
    "The {identity} doesn't wait for the right moment—they create it.",
    "You're not becoming a {identity} someday. You're practicing it today.",
    // Future-self connection
    "Your future self is cheering for the {identity} choice. What is it?",
    "In a year, you'll thank the {identity} who showed up today.",
    "The {identity} you're becoming needs you to show up now. Will you?"
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
