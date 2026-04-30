import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
 * Génère du contenu avec Gemini.
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
 * Génère du contenu en streaming.
 */
export async function* generateTextStream(
  systemInstruction: string,
  messages: any[],
  options?: GeminiTextOptions
): AsyncIterable<string> {
  const model = options?.model || "gemini-2.5-flash-lite";
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
 * V22 : Utilisation de @google/generative-ai et gemini-1.5-flash pour la stabilité
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string,
  languageHint = "fr-FR",
): Promise<string> {
  const cleanMimeType = mimeType.split(";")[0];
  
  // Instanciation locale pour ne pas interférer avec le RAG (genAI)
  const aiStudio = new GoogleGenerativeAI(GEMINI_API_KEY as string);
  const model = aiStudio.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0,
        topP: 0.05,
        topK: 1,
        maxOutputTokens: 256,
      },
  });

  try {
    const prompt = `Tu es un moteur de transcription audio.
Langue attendue: ${languageHint} (français).
Règles strictes :
- Transcris EXACTEMENT ce qui est prononcé, sans reformuler et sans traduire.
- Privilégie une reconnaissance en français (France) pour les homophones et la ponctuation.
- Si l'audio est silencieux, inaudible ou trop ambigu, réponds uniquement [SILENCE].
- Si c'est surtout du bruit de fond, réponds uniquement [BRUIT].
- Si aucun mot n'est identifiable, réponds uniquement [VIDE].
- N'invente jamais de contenu.
- Réponds avec une seule ligne, sans guillemets ni explication.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: cleanMimeType,
          data: base64Audio
        }
      }
    ]);

    const resultText = result.response.text().trim();
    const oneLine = resultText.split("\n").map((line) => line.trim()).filter(Boolean)[0] || "";
    const normalizedTag = oneLine.toUpperCase();

    if (normalizedTag === "[SILENCE]" || normalizedTag === "[BRUIT]" || normalizedTag === "[VIDE]") {
      return normalizedTag;
    }

    // Filet de sécurité contre les réponses méta / inventées
    if (!oneLine || oneLine.length < 2) return "[VIDE]";
    if (/^I (can|cannot|can't)|^Je (peux|ne peux pas)|^Sorry|^Désolé/i.test(oneLine)) return "[SILENCE]";

    return oneLine;
  } catch (error: any) {
    console.error("[Transcribe Audio Error]", error.message);
    throw new Error(`Erreur IA Transcription: ${error.message}`);
  }
}
