import { put } from "@vercel/blob";
import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["TEACHER", "ADMIN"]);
  if ("status" in auth) return auth;

  const formData = await request.formData().catch(() => null);
  if (!formData) return apiError("Requête invalide", 400);

  const file = formData.get("audio") as File | null;
  if (!file) return apiError("Aucun fichier audio fourni", 400);

  if (file.size > 20 * 1024 * 1024) return apiError("Audio trop lourd (max 20 Mo)", 400);

  const allowed = ["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg", "audio/wav"];
  const baseType = file.type.split(";")[0].trim();
  if (!allowed.includes(baseType)) return apiError("Format audio non supporté", 400);

  const ext = file.type.split("/")[1]?.split(";")[0] ?? "webm";
  const name = `audio-comment-${auth.payload.sub}-${Date.now()}.${ext}`;

  const blob = await put(`audio-comments/${name}`, file, { access: "public" });

  return apiSuccess({ url: blob.url });
}
