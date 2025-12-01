import { GoogleGenAI } from "@google/genai";
import { GEMINI_SYSTEM_PROMPT } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiResponse = async (
  message: string, 
  context?: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please check your .env configuration.";
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Construct a rich prompt with context if available
    const fullPrompt = context 
      ? `Context: ${context}\n\nUser Query: ${message}`
      : message;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error while analyzing your infrastructure. Please try again.";
  }
};