import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getChatResponse(message: string, history: { role: string; parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "You are a helpful shopping assistant for Halal-Bazaar, a multi-vendor e-commerce platform. You help users find products, explain features, and provide shopping advice. Be polite, professional, and concise.",
    },
    history: history,
  });

  const result = await chat.sendMessage({ message });
  return result.text;
}
