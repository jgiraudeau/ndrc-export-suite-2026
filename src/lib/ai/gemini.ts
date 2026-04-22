import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY / GOOGLE_API_KEY environment variable");
}

// Client 1 : Version "Entreprise/Vertex" (Nécessaire pour le File Search / RAG actuel)
export const genAI = new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY,
});

// Client 2 : Version "Standard/AI Studio" (Nécessaire pour la transcription audio avec cette clé)
const aiStudio = new GoogleGenerativeAI(GEMINI_API_KEY);

type GeminiTextOptions = {
  model?: string;
  fileSearchStoreNames?: string[];
  metadataFilter?: string;
  fileSearchTopK?: number;
  temperature?: number;
  maxOutputTokens?: number;
};

/**
 * Génère du contenu avec Gemini Pro (via le moteur Entreprise pour le RAG).
 */
export async function generateText(
  systemInstruction: string,
  userMessage: string,
  options?: GeminiTextOptions
): Promise<string> {
  const model = options?.model || "gemini-1.5-flash";
  const config: GenerateContentConfig = {
    systemInstruction,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxOutputTokens ?? 8192,
  };

  if (options?.fileSearchStoreNames?.length) {
    config.tools = [
      {
        fileSearch: {
          fileSearchStoreNames: options.fileSearchStoreNames,
          metadataFilter: options.metadataFilter,
          topK: options.fileSearchTopK,
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
 * Génère du contenu en streaming (via le moteur Entreprise pour le Chatbot).
 */
export async function* generateTextStream(
  systemInstruction: string,
  messages: any[],
  options?: GeminiTextOptions
): AsyncIterable<string> {
  const model = options?.model || "gemini-1.5-flash";
  const config: GenerateContentConfig = {
    systemInstruction,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxOutputTokens ?? 4096,
  };

  if (options?.fileSearchStoreNames?.length) {
    config.tools = [
      {
        fileSearch: {
          fileSearchStoreNames: options.fileSearchStoreNames,
          metadataFilter: options.metadataFilter,
          topK: options.fileSearchTopK,
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
    if (chunk.text) yield chunk.text;
  }
}

/**
 * Transcrit un contenu audio (via le moteur AI Studio Standard).
 * C'est cette version qui évite les erreurs 404 sur votre clé.
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string,
  options?: GeminiTextOptions
): Promise<string> {
  const modelName = options?.model || "gemini-1.5-flash";
  const model = aiStudio.getGenerativeModel({ model: modelName });
  
  const cleanMimeType = mimeType.split(";")[0];
  const prompt = "Transcris exactement cet audio en français. Ne génère aucune autre phrase, aucun commentaire, aucun timestamp.";

  try {
    const result = await model.generateContent([
      { inlineData: { data: base64Audio, mimeType: cleanMimeType } },
      { text: prompt }
    ]);
    const response = await result.response;
    return response.text()?.trim() || "";
  } catch (error: any) {
    console.error("[AI Studio Transcribe Error]", error.message);
    throw new Error(`Erreur transcription : ${error.message}`);
  }
}
