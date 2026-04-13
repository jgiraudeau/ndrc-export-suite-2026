import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import {
  deleteStoreDocument,
  ensureGlobalFileSearchStore,
  listGlobalStoreDocuments,
  uploadAdminFileToGlobalStore,
} from "@/lib/ai/file-search";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB (Google File Search limit)

// GET /api/rag/documents - liste des documents indexes dans le store RAG global
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN", "TEACHER"]);
  if ("status" in auth) return auth;

  try {
    const result = await listGlobalStoreDocuments();
    return apiSuccess(result);
  } catch (err) {
    console.error("[rag/documents][GET]", err);
    return apiError("Impossible de recuperer les documents RAG", 500);
  }
}

// POST /api/rag/documents - upload d'un document multi-format vers le store RAG global (admin)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const formData = await request.formData();
    const rawFile = formData.get("file");

    if (!(rawFile instanceof File)) {
      return apiError("Le champ 'file' est obligatoire", 400);
    }

    if (rawFile.size <= 0) {
      return apiError("Le fichier est vide", 400);
    }

    if (rawFile.size > MAX_FILE_SIZE_BYTES) {
      return apiError("Fichier trop volumineux (max 100MB)", 400);
    }

    const result = await uploadAdminFileToGlobalStore(rawFile);
    return apiSuccess(result, 201);
  } catch (err) {
    console.error("[rag/documents][POST]", err);
    return apiError("Echec de l'indexation du document", 500);
  }
}

// DELETE /api/rag/documents - suppression d'un document indexe du store global (admin)
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const { documentName } = await request.json();
    if (!documentName || typeof documentName !== "string") {
      return apiError("documentName est requis", 400);
    }

    const storeName = await ensureGlobalFileSearchStore();
    if (!documentName.startsWith(`${storeName}/documents/`)) {
      return apiError("Document non autorise pour ce store global", 403);
    }

    await deleteStoreDocument(documentName);
    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error("[rag/documents][DELETE]", err);
    return apiError("Impossible de supprimer le document", 500);
  }
}
