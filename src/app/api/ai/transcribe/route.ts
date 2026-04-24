import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { transcribeAudio } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  // Seuls les professeurs et les administrateurs peuvent utiliser la transcription (coût)
  // On récupère auth pour logger si besoin mais on ne l'utilise pas forcément pour porter l'ID
  const auth = await requireAuth(req, ["TEACHER", "ADMIN"]);
  if (auth instanceof NextResponse) {
    console.warn("[Transcribe Auth Fail]", auth.status);
    return auth;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;
    
    if (!file) {
      return apiError("Aucun fichier audio reçu (formData 'audio' manquant)", 400);
    }

    console.log("[Transcribe Request]", {
        name: file.name,
        size: file.size,
        type: file.type,
        user: auth.payload.sub
    });

    // Conversion en Buffer puis en Base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Audio = buffer.toString("base64");
    const mimeType = file.type || "audio/webm";

    // Appel à la fonction unifiée du projet (lib/ai/gemini.ts)
    console.log("[Transcribe] Calling Gemini...");
    // TEMPORAIRE : On renvoie les infos du fichier au lieu de l'envoyer à Gemini
    // const text = await transcribeAudio(base64Audio, mimeType);
    const text = `[DEBUG] Fichier reçu : ${base64Audio.length} bytes, MimeType : ${mimeType}`;

    console.log("[Transcribe Success]", {
        textLength: text.length,
        textHead: text.slice(0, 50)
    });

    return apiSuccess({ text: text });
  } catch (error: any) {
    console.error("Erreur serveur transcription Gemini (V3):", error);
    
    // On renvoie un message très parlant pour aider le débogage UI
    const detailedMessage = error.message || "Erreur inconnue";
    return apiError(`La transcription a échoué : ${detailedMessage}`, 500);
  }
}
