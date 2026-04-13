import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { syncKnowledgeFolderToGlobalStore } from "@/lib/ai/file-search";

// POST /api/rag/sync - synchronise le dossier knowledge vers le store RAG global
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const folderPath =
      typeof body?.folderPath === "string" && body.folderPath.trim().length > 0
        ? body.folderPath.trim()
        : undefined;
    const removeMissing =
      typeof body?.removeMissing === "boolean" ? body.removeMissing : true;

    const result = await syncKnowledgeFolderToGlobalStore({
      folderPath,
      removeMissing,
    });

    return apiSuccess(result);
  } catch (err) {
    console.error("[rag/sync][POST]", err);
    const message =
      err instanceof Error ? err.message : "Echec de la synchronisation RAG";
    return apiError(message, 500);
  }
}
