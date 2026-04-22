import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY / GOOGLE_API_KEY environment variable");
}

// Client RAG/Chat (Moteur Entreprise)
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
 * Génère du contenu avec Gemini (via le moteur Entreprise pour le RAG).
 */
export async function generateText(
  systemInstruction: string,
  userMessage: string,
  options?: GeminiTextOptions
): Promise<string> {
  const model = options?.model || "gemini-2.5-flash-lite"; // Version 2.5 par défaut
  const config: GenerateContentConfig = {
    systemInstruction,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxOutputTokens ?? 8192,
  };

  if (options?.fileSearchStoreNames?.length) {
    config.tools = [{
        fileSearch: {
          fileSearchStoreNames: options.fileSearchStoreNames,
          metadataFilter: options.metadataFilter,
          topK: options.fileSearchTopK,
        },
    }];
  }

  const response = await genAI.models.generateContent({
    model,
    contents: userMessage,
    config,
  });
  return response.text ?? "";
}

/**
 * Génère du contenu en streaming (via le moteur Entreprise).
 */
export async function* generateTextStream(
  systemInstruction: string,
  messages: any[],
  options?: GeminiTextOptions
): AsyncIterable<string> {
  const model = options?.model || "gemini-2.5-flash-lite"; // Version 2.5 par défaut
  const config: GenerateContentConfig = {
    systemInstruction,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxOutputTokens ?? 4096,
  };

  if (options?.fileSearchStoreNames?.length) {
    config.tools = [{
        fileSearch: {
          fileSearchStoreNames: options.fileSearchStoreNames,
          metadataFilter: options.metadataFilter,
          topK: options.fileSearchTopK,
        },
    }];
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
 * Transcrit un contenu audio.
 * Utilise Gemini 2.5 Flash Lite (Le tout dernier modèle de votre liste).
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string,
): Promise<string> {
  const cleanMimeType = mimeType.split(";")[0];
  
  // Modèle 2.5 LITE : Le plus récent et économe en quota sur votre compte
  const modelName = "gemini-2.5-flash-lite"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [{
      parts: [
        { inlineData: { mimeType: cleanMimeType, data: base64Audio } },
        { text: "Transcris exactement cet audio en français. Ne génère que le texte." }
      ]
    }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 1024
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error("Quota Google atteint. Veuillez patienter 1 minute.");
      }
      throw new Error(`Erreur API Google (Modèle 2.5): ${JSON.stringify(errorJson)}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch (error: any) {
    console.error("[Transcribe Audio Error]", error.message);
    throw error;
  }
}
