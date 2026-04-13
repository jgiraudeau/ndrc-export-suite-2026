import { GoogleGenAI, type Content, type GenerateContentConfig } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY / GOOGLE_API_KEY environment variable");
}

export const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Génère du contenu avec Gemini Pro en mode texte.
 * @param systemInstruction - Instruction système (prompt template)
 * @param userMessage - Message utilisateur
 */
export async function generateText(
  systemInstruction: string,
  userMessage: string,
  options?: {
    model?: string;
    fileSearchStoreNames?: string[];
  }
): Promise<string> {
  const model = options?.model || "gemini-2.5-flash-lite";
  const config: GenerateContentConfig = {
    systemInstruction,
    temperature: 0.7,
    maxOutputTokens: 8192,
  };

  if (options?.fileSearchStoreNames?.length) {
    config.tools = [
      {
        fileSearch: {
          fileSearchStoreNames: options.fileSearchStoreNames,
        },
      },
    ];
  }

  const response = await genAI.models.generateContent({
    model,
    contents: userMessage,
    config,
  });
  return response.text ?? "";
}

/**
 * Génère du contenu en streaming avec Gemini.
 * Utilisé pour le chatbot tuteur (réponses progressives).
 */
export async function* generateTextStream(
  systemInstruction: string,
  messages: Content[],
  options?: {
    model?: string;
    fileSearchStoreNames?: string[];
  }
): AsyncIterable<string> {
  const model = options?.model || "gemini-2.5-flash-lite";
  const config: GenerateContentConfig = {
    systemInstruction,
    temperature: 0.7,
    maxOutputTokens: 4096,
  };

  if (options?.fileSearchStoreNames?.length) {
    config.tools = [
      {
        fileSearch: {
          fileSearchStoreNames: options.fileSearchStoreNames,
        },
      },
    ];
  }

  const stream = await genAI.models.generateContentStream({
    model,
    contents: messages,
    config,
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}
