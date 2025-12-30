import { GoogleGenAI } from "@google/genai";
import { GameMode, Language } from "../types";

const initGenAI = () => {
  if (!process.env.API_KEY) {
    console.warn("No API_KEY found in environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateSenseiFeedback = async (score: number, mode: GameMode, bestCombo: number, lang: Language) => {
  const ai = initGenAI();
  if (!ai) {
    return lang === 'CN' ? "API Key 缺失..." : "The spirits are silent today... (Check API Key)";
  }

  try {
    const prompt = `
      You are a wise, mystical martial arts Fruit Slicing Sensei.
      The player just finished a game.
      
      Language: ${lang === 'CN' ? 'Simplified Chinese (Mandarin)' : 'English'}
      Stats:
      - Mode: ${mode}
      - Score: ${score}
      - Best Combo: ${bestCombo}

      Rules:
      1. If score < 50: Gentle encouragement.
      2. If score 50-200: Praise.
      3. If score > 200: Amazed/Philosophical.
      4. Max 2 sentences.
      5. Do NOT mention 'Gemini' or 'AI'.
      6. If Language is Chinese, respond in Chinese.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || (lang === 'CN' ? "熟能生巧。" : "Practice makes perfect.");
  } catch (error) {
    console.error("Gemini Error:", error);
    return lang === 'CN' ? "云雾缭绕..." : "The path is clouded... try again.";
  }
};