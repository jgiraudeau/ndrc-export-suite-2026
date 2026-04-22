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

/**
 * Transcrit un contenu audio en utilisant Gemini 1.5 Flash.
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string,
  options?: GeminiTextOptions
): Promise<string> {
  const primaryModel = "gemini-1.5-flash-latest";
  const fallbackModel = "gemini-2.5-flash-lite";
  
  const prompt = "TRANSCRIPTION LITTÉRALE : Transcris mot à mot le contenu de cet audio. \n" +
                 "IMPORTANT : Produis uniquement le texte parlé. \n" +
                 "INTERDICTION STRICTE : Ne génère AUCUN timestamp (ex: 00:01, 00:02), aucune métadonnée, aucun découpage temporel. \n" +
                 "Si tu n'entends rien de compréhensible, renvoie exactement [VIDE].";

  const config: GenerateContentConfig = {
    temperature: 0.1,
    maxOutputTokens: 1024,
  };

  try {
    const response = await genAI.models.generateContent({
      model: primaryModel,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: base64Audio, mimeType } }
          ],
        },
      ] as any,
      config,
    });
    return response.text?.trim() ?? "";
  } catch (error: any) {
    console.warn(`[Gemini] Primary model ${primaryModel} failed, trying fallback ${fallbackModel}`, error.message);
    
    // Fallback sur le modèle du projet si le premier échoue (ex: 404)
    const response = await genAI.models.generateContent({
      model: fallbackModel,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: base64Audio, mimeType } }
          ],
        },
      ] as any,
      config,
    });
    return response.text?.trim() ?? "";
  }
}
