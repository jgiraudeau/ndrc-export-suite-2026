import { GoogleGenAI, type Content, type GenerateContentConfig } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY / GOOGLE_API_KEY environment variable");
}

export const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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
 * @param systemInstruction - Instruction système (prompt template)
 * @param userMessage - Message utilisateur
 */
export async function generateText(
  systemInstruction: string,
  userMessage: string,
  options?: GeminiTextOptions
): Promise<string> {
  const model = options?.model || "gemini-2.5-flash-lite";
  const config: GenerateContentConfig = {
    systemInstruction,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxOutputTokens ?? 8192,
  };

  if (options?.fileSearchStoreNames?.length) {
    const fileSearchConfig: {
      fileSearchStoreNames: string[];
      metadataFilter?: string;
      topK?: number;
    } = {
      fileSearchStoreNames: options.fileSearchStoreNames,
    };
    if (options.metadataFilter) {
      fileSearchConfig.metadataFilter = options.metadataFilter;
    }
    if (typeof options.fileSearchTopK === "number") {
      fileSearchConfig.topK = options.fileSearchTopK;
    }

    config.tools = [
      {
        fileSearch: fileSearchConfig,
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
  options?: GeminiTextOptions
): AsyncIterable<string> {
  const model = options?.model || "gemini-2.5-flash-lite";
  const config: GenerateContentConfig = {
    systemInstruction,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxOutputTokens ?? 4096,
  };

  if (options?.fileSearchStoreNames?.length) {
    const fileSearchConfig: {
      fileSearchStoreNames: string[];
      metadataFilter?: string;
      topK?: number;
    } = {
      fileSearchStoreNames: options.fileSearchStoreNames,
    };
    if (options.metadataFilter) {
      fileSearchConfig.metadataFilter = options.metadataFilter;
    }
    if (typeof options.fileSearchTopK === "number") {
      fileSearchConfig.topK = options.fileSearchTopK;
    }

    config.tools = [
      {
        fileSearch: fileSearchConfig,
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
