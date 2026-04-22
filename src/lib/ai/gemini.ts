import { GoogleGenAI, type Content, type GenerateContentConfig } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY / GOOGLE_API_KEY environment variable");
}

// On utilise le SDK @google/genai qui supporte le File Search (RAG)
export const genAI = new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY,
});

type GeminiTextOptions = {
  model?: string;
  fileSearchStoreNames?: string[];
  metadataFilter?: string;
  fileSearchTopK?: number;
  temperature?: number;
  maxOutputTokens?: number;
};

/**
 * Génère du contenu avec Gemini Pro en mode texte.
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
 * Génère du contenu en streaming avec Gemini.
 * Utilisé pour le chatbot tuteur.
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
 * Transcrit un contenu audio en utilisant Gemini 1.5 Flash.
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string,
  options?: GeminiTextOptions
): Promise<string> {
  // Utilisation d'un nom de modèle ultra-standard pour éviter les 404 du SDK GenAI
  const model = "gemini-1.5-flash";
  const cleanMimeType = mimeType.split(";")[0];
  
  const prompt = "Transcris exactement cet audio en français. Ne génère aucune autre phrase, aucun commentaire, aucun timestamp.";

  const config: GenerateContentConfig = {
    temperature: 0,
    maxOutputTokens: 1024,
  };

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64Audio, mimeType: cleanMimeType } },
            { text: prompt }
          ],
        },
      ] as any,
      config,
    });
    return response.text?.trim() ?? "";
  } catch (error: any) {
    console.error("[Gemini Transcribe Error]", error.message);
    throw new Error(`Transcription impossible : ${error.message}`);
  }
}
