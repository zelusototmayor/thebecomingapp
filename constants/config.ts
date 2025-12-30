export const CONFIG = {
  maxGoals: 3,
  openAiModel: 'gpt-5.2',
  openAiApiUrl: 'https://api.openai.com/v1/chat/completions',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
};

export const NOTIFICATION_DAYS = {
  '2x': [1, 4], // Monday, Thursday
  '3x': [1, 3, 5], // Monday, Wednesday, Friday
};
