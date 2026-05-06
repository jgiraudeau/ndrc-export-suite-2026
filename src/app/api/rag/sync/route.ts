import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { syncKnowledgeFolderToGlobalStore } from "@/lib/ai/file-search";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit-log";

// POST /api/rag/sync - synchronise le dossier knowledge vers le store RAG global
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN"]);
  if ("status" in auth) return auth;

  const rateLimit = checkRateLimit(request, "rag:sync", 5, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

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

    await writeAuditLog({
      actor: auth.payload,
      action: "admin.rag.sync",
      targetType: "rag_store",
      metadata: { folderPath, removeMissing },
      request,
    });

    return apiSuccess(result);
  } catch (err) {
    console.error("[rag/sync][POST]", err);
    const message =
      err instanceof Error ? err.message : "Echec de la synchronisation RAG";
    return apiError(message, 500);
  }
}
