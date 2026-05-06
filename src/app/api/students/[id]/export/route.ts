import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit-log";
import { buildStudentExportFilename, getStudentForRgpdExport } from "@/lib/student-export";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(request, ["TEACHER", "STUDENT", "ADMIN"]);
    if ("status" in auth) return auth;

    try {
        const { id } = await context.params;
        const exportPayload = await getStudentForRgpdExport(id, auth.payload);

        if (!exportPayload) {
            return apiError("Étudiant introuvable", 404);
        }

        await writeAuditLog({
            actor: auth.payload,
            action: "student.data.export",
            targetType: "student",
            targetId: id,
            metadata: { format: "json", formatVersion: exportPayload.formatVersion },
            request,
        });

        const filename = buildStudentExportFilename(exportPayload.student);

        return new NextResponse(JSON.stringify(exportPayload, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("[students/[id]/export][GET]", error);
        return apiError("Erreur serveur lors de l'export", 500);
    }
}
