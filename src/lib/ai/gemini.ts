import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY / GOOGLE_API_KEY environment variable");
}

export const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

type GeminiTextOptions = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

/**
 * Génère du contenu avec Gemini en mode texte (standard).
 */
export async function generateText(
  systemInstruction: string,
  userMessage: string,
  options?: GeminiTextOptions
): Promise<string> {
  const modelName = options?.model || "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction
  });

  const result = await model.generateContent(userMessage);
  const response = await result.response;
  return response.text() || "";
}

/**
 * Transcrit un contenu audio en utilisant le SDK standard.
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string,
  options?: GeminiTextOptions
): Promise<string> {
  const modelName = options?.model || "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const cleanMimeType = mimeType.split(";")[0];
  
  const prompt = "Transcris exactement cet audio en français. Ne génère aucune autre phrase, aucun commentaire, aucun timestamp.";

  const parts: Part[] = [
    { inlineData: { data: base64Audio, mimeType: cleanMimeType } },
    { text: prompt }
  ];

  try {
    // Watchdog de 10s pour la sécurité
    const generatePromise = model.generateContent(parts);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout IA (10s)")), 10000)
    );

    const result = (await Promise.race([generatePromise, timeoutPromise])) as any;
    const response = await result.response;
    return response.text()?.trim() || "";
  } catch (error: any) {
    console.error("[Gemini SDK Error]", error.message);
    throw new Error(`Erreur SDK Gemini : ${error.message}`);
  }
}
