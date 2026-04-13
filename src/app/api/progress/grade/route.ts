import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

// PATCH /api/progress/grade — évaluation formateur d'une compétence étudiant
export async function PATCH(request: NextRequest) {
    const auth = await requireAuth(request, ["TEACHER"]);
    if ("status" in auth) return auth;
    const teacherId = auth.payload.sub;

    try {
        const { studentId, competencyId, teacherStatus, teacherFeedback, type = "FORMATIVE" } = await request.json();

        // Si c'est du CCF, on utilise un suffixe pour l'étanchéité
        const finalCompetencyId = type === "CCF" ? `${competencyId}_CCF` : competencyId;

        if (!studentId || !competencyId || typeof teacherStatus !== "number") {
            return apiError("studentId, competencyId et teacherStatus requis");
        }

        if (teacherStatus < 0 || teacherStatus > 4) {
            return apiError("teacherStatus doit être entre 0 et 4");
        }

        // Vérifier que l'étudiant appartient à ce formateur
        const student = await prisma.student.findFirst({
            where: { id: studentId, teacherId },
        });
        if (!student) {
            return apiError("Étudiant introuvable ou non autorisé", 404);
        }

        // Upsert : crée un Progress si l'étudiant n'a pas encore auto-évalué
        const record = await prisma.progress.upsert({
            where: { studentId_competencyId: { studentId, competencyId: finalCompetencyId } },
            create: {
                studentId,
                competencyId: finalCompetencyId,
                acquired: false,
                status: 0,
                teacherStatus,
                teacherFeedback: teacherFeedback?.trim() || null,
                teacherGradedAt: new Date(),
            },
            update: {
                teacherStatus,
                teacherFeedback: teacherFeedback?.trim() || null,
                teacherGradedAt: new Date(),
            },
        });

        return apiSuccess({
            competencyId: record.competencyId,
            teacherStatus: record.teacherStatus,
            teacherFeedback: record.teacherFeedback,
            teacherGradedAt: record.teacherGradedAt?.toISOString() ?? null,
        });
    } catch (err) {
        console.error("[progress/grade PATCH]", err);
        return apiError("Erreur serveur", 500);
    }
}
