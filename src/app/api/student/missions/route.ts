import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

// GET /api/student/missions — Missions assignées à l'étudiant
export async function GET(request: NextRequest) {
    const auth = await requireAuth(request, ["STUDENT"]);
    if ("status" in auth) return auth;

    try {
        const assignments = await prisma.missionAssignment.findMany({
            where: { studentId: auth.payload.sub },
            include: {
                mission: true,
                teacher: { select: { name: true } },
                journal: { orderBy: { date: "desc" } }
            },
            orderBy: { assignedAt: "desc" },
        });

        const result = assignments.map((a) => ({
            id: a.id,
            missionId: a.mission.id,
            title: a.mission.title,
            content: a.mission.content,
            platform: a.mission.platform,
            level: a.mission.level,
            competencyIds: a.mission.competencyIds,
            status: a.status,
            assignedAt: a.assignedAt,
            completedAt: a.completedAt,
            teacherName: a.teacher?.name || "Formateur",
            journal: a.journal,
        }));

        return apiSuccess(result);
    } catch (err) {
        console.error("[student/missions GET]", err);
        return apiError("Erreur serveur", 500);
    }
}
