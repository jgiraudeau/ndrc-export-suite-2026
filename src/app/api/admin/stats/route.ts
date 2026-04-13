import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

// GET /api/admin/stats - Récupère les KPIs globaux
export async function GET(request: NextRequest) {
    const auth = await requireAuth(request, ["ADMIN"]);
    if ("status" in auth) return auth;

    try {
        const [
            teacherCount,
            pendingTeacherCount,
            studentCount,
            classCount,
            experienceCount,
            journalCount
        ] = await Promise.all([
            prisma.teacher.count(),
            prisma.teacher.count({ where: { status: "pending" } }),
            prisma.student.count(),
            prisma.class.count(),
            prisma.professionalExperience.count(),
            prisma.journalEntry.count()
        ]);

        return apiSuccess({
            teachers: teacherCount,
            pendingTeachers: pendingTeacherCount,
            students: studentCount,
            classes: classCount,
            experiences: experienceCount,
            entries: journalCount
        });
    } catch (err) {
        console.error("[admin/stats GET]", err);
        return apiError("Erreur lors de la récupération des statistiques", 500);
    }
}
