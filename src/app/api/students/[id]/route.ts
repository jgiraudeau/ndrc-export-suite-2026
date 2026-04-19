import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

// GET /api/students/[id] — détail complet d'un étudiant (formateur)
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(request, ["TEACHER"]);
    if ("status" in auth) return auth;

    try {
        const params = await context.params;
        const studentId = params.id;

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                class: true,
                progress: true,
                experiences: {
                    select: { status: true },
                },
                comments: {
                    include: { teacher: true },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!student || student.teacherId !== auth.payload.sub) {
            return apiError("Étudiant introuvable", 404);
        }

        const acquiredCount = student.progress.filter((p) => p.acquired).length;
        const totalExperiences = student.experiences.length;
        const validatedExperiences = student.experiences.filter((e) => e.status === "VALIDATED").length;
        const submittedExperiences = student.experiences.filter((e) => e.status === "SUBMITTED").length;

        let lastActive = null;
        if (student.progress.length > 0) {
            const sorted = [...student.progress].sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            lastActive = sorted[0].updatedAt.toISOString();
        }

        return apiSuccess({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            identifier: student.identifier,
            classCode: student.class.code,
            className: student.class.name,
            wpUrl: student.wpUrl,
            prestaUrl: student.prestaUrl,
            acquiredCount,
            lastActive,
            passport: {
                totalExperiences,
                submittedExperiences,
                validatedExperiences,
            },
            competencies: student.progress.map((p) => ({
                competencyId: p.competencyId,
                acquired: p.acquired,
                status: p.status,
                proof: p.proof,
                updatedAt: p.updatedAt.toISOString(),
                teacherStatus: p.teacherStatus,
                teacherFeedback: p.teacherFeedback,
                teacherGradedAt: p.teacherGradedAt?.toISOString() ?? null,
            })),
            comments: student.comments.map((c) => ({
                id: c.id,
                text: c.text,
                authorName: c.teacher?.name || "Professeur",
                date: c.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error("[GET /api/students/[id]] Error:", error);
        return apiError("Erreur serveur", 500);
    }
}

// PATCH /api/students/[id]
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(request, ["TEACHER"]);
    if ("status" in auth) return auth;

    try {
        const params = await context.params;
        const studentId = params.id;
        const body = (await request.json()) as { wpUrl?: unknown; prestaUrl?: unknown };

        // Check if student belongs to the teacher
        const existingStudent = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!existingStudent) {
            return apiError("Étudiant introuvable", 404);
        }

        if (existingStudent.teacherId !== auth.payload.sub) {
            return apiError("Non autorisé à modifier cet étudiant", 403);
        }

        const dataToUpdate: { wpUrl?: string | null; prestaUrl?: string | null } = {};
        if (body.wpUrl !== undefined) {
            dataToUpdate.wpUrl = typeof body.wpUrl === "string" ? body.wpUrl.trim() : null;
        }
        if (body.prestaUrl !== undefined) {
            dataToUpdate.prestaUrl =
                typeof body.prestaUrl === "string" ? body.prestaUrl.trim() : null;
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return apiError("Aucune donnée à mettre à jour", 400);
        }

        const updatedStudent = await prisma.student.update({
            where: { id: studentId },
            data: dataToUpdate,
        });

        return apiSuccess({
            message: "Étudiant mis à jour",
            student: updatedStudent,
        });
    } catch (error) {
        console.error("[PATCH /api/students/[id]] Error:", error);
        return apiError("Erreur serveur lors de la mise à jour de l'étudiant", 500);
    }
}

// DELETE /api/students/[id]
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(request, ["TEACHER"]);
    if ("status" in auth) return auth;

    try {
        const params = await context.params;
        const studentId = params.id;

        const existingStudent = await prisma.student.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                teacherId: true,
                firstName: true,
                lastName: true,
            },
        });

        if (!existingStudent) {
            return apiError("Étudiant introuvable", 404);
        }

        if (existingStudent.teacherId !== auth.payload.sub) {
            return apiError("Non autorisé à supprimer cet étudiant", 403);
        }

        await prisma.student.delete({
            where: { id: studentId },
        });

        return apiSuccess({
            deleted: true,
            studentId,
            message: `Étudiant ${existingStudent.firstName} ${existingStudent.lastName} supprimé`,
        });
    } catch (error) {
        console.error("[DELETE /api/students/[id]] Error:", error);
        return apiError("Erreur serveur lors de la suppression de l'étudiant", 500);
    }
}
