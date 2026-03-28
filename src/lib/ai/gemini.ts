import { GoogleGenAI } from '@google/genai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

export const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

/**
 * Génère du contenu avec Gemini Pro en mode texte.
 * @param systemInstruction - Instruction système (prompt template)
 * @param userMessage - Message utilisateur
 */
export async function generateText(
  systemInstruction: string,
  userMessage: string
): Promise<string> {
  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: userMessage,
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });
  return response.text ?? '';
}

/**
 * Génère du contenu en streaming avec Gemini.
 * Utilisé pour le chatbot tuteur (réponses progressives).
 */
export async function* generateTextStream(
  systemInstruction: string,
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[]
): AsyncIterable<string> {
  const stream = await genAI.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: messages,
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}
