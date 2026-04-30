import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { transcribeAudio } from "@/lib/ai/gemini";
import OpenAI from "openai";

export const maxDuration = 60;

function normalizeTranscript(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PROMPT_ECHO_PATTERNS = [
  "transcription fidele en francais ne pas inventer sortie en une seule ligne",
  "transcription en francais",
];

function isGenericHallucinationLike(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (t.length < 18) return true;
  // Phrases très génériques observées en hallucination
  if (/^le\s+\w+\s+est\s+\w+/.test(t)) return true;
  if (/^this is|^hello\b|^bonjour\b/.test(t)) return true;
  return false;
}

function readTranscriptionText(result: unknown): string {
  if (typeof result === "string") return result.trim();
  if (result && typeof result === "object" && "text" in result) {
    const text = (result as { text?: unknown }).text;
    return typeof text === "string" ? text.trim() : "";
  }
  return "";
}

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
    if (file.size === 0) {
      return apiError("Le fichier audio est vide", 400);
    }

    console.log("[Transcribe Request]", {
        name: file.name,
        size: file.size,
        type: file.type,
        user: auth.payload.sub
    });

    // Conversion en Buffer puis en Base64 (fallback Gemini)
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Audio = buffer.toString("base64");
    const mimeType = (file.type || "audio/webm").split(";")[0];
    const allowedMimeTypes = new Set([
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/mp3",
    ]);
    if (!allowedMimeTypes.has(mimeType)) {
      return apiError(`Format audio non supporté: ${mimeType}`, 415);
    }
    if (file.size <= 4096) {
      return apiSuccess({ text: "[SILENCE]" });
    }

    let text = "";
    let bestEffort = "";
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        console.log("[Transcribe] Calling OpenAI...");
        const openai = new OpenAI({ apiKey: openaiKey });
        const audioFile = new File([buffer], file.name || "comment.webm", {
          type: mimeType,
        });
        const result = await openai.audio.transcriptions.create({
          model: "gpt-4o-mini-transcribe",
          file: audioFile,
          language: "fr",
          prompt: "Transcription fidèle en français d'un commentaire d'évaluation BTS NDRC. Ne pas inventer.",
        });
        const candidate = readTranscriptionText(result);
        if (candidate && !["[BRUIT]", "[SILENCE]", "[VIDE]"].includes(candidate)) {
          bestEffort = candidate;
          if (!isGenericHallucinationLike(candidate)) {
            text = candidate;
          }
        }
      } catch (openaiError: any) {
        console.warn("[Transcribe] OpenAI failed, fallback Gemini:", openaiError?.message || openaiError);
      }
    }

    if (!text) {
      console.log("[Transcribe] Calling Gemini fallback...");
      text = await transcribeAudio(base64Audio, mimeType);
    }

    // Filtre anti-phrase parasite connue captée sur certains environnements audio
    // et anti-écho du prompt de transcription.
    const normalized = normalizeTranscript(text);
    if (PROMPT_ECHO_PATTERNS.some((p) => normalized === p || normalized.includes(p))) {
      text = "";
    }
    if (
      normalized.includes("sous titres realises para la communaute d amara org") ||
      normalized.includes("subtitulos realizados por la comunidad de amara org")
    ) {
      text = "";
    }

    // Anti-blocage UX: renvoyer le meilleur effort brut si disponible.
    if ((!text || text === "[BRUIT]" || text === "[SILENCE]" || text === "[VIDE]") && bestEffort) {
      text = bestEffort;
    }

    // Dernier filet de sécurité (éviter une chaîne vide côté UI)
    if (!text) {
      text = "[audio non transcrit]";
    }

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
