import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  // Seuls les professeurs et les administrateurs peuvent utiliser la transcription (coût)
  const auth = await requireAuth(req, ["TEACHER", "ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  if (!apiKey) {
    return apiError("Clé API Google/Gemini manquante sur le serveur", 500);
  }

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;
    
    if (!file) {
      return apiError("Aucun fichier audio reçu", 400);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Conversion en Buffer pour transfert à Gemini
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    const prompt = "Transcription fidèle et naturelle de ce court commentaire audio pédagogique d'un professeur. Renvoie uniquement le texte transcrit, sans ajout d'intro/outro, sans ponctuation excessive. Si c'est inaudible ou vide, renvoie une chaîne vide.";

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Audio,
          mimeType: file.type || "audio/webm",
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    return apiSuccess({ text: text.trim() });
  } catch (error: any) {
    console.error("Erreur serveur transcription Gemini:", error);
    return apiError("La transcription a échoué : " + error.message, 500);
  }
}
