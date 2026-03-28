import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

// GET /api/journal?experienceId=... or ?assignmentId=...
export async function GET(request: NextRequest) {
    const auth = await requireAuth(request, ["TEACHER", "STUDENT"]);
    if ("status" in auth) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const experienceId = searchParams.get("experienceId");
        const assignmentId = searchParams.get("assignmentId");
        const studentId = searchParams.get("studentId"); // For teacher view

        let whereClause: any = {};
        if (experienceId) whereClause.experienceId = experienceId;
        else if (assignmentId) whereClause.assignmentId = assignmentId;
        else if (studentId && auth.payload.role === "TEACHER") {
            whereClause = {
                OR: [
                    { experience: { studentId: studentId } },
                    { assignment: { studentId: studentId } }
                ]
            };
        } else if (auth.payload.role === "STUDENT") {
            whereClause = {
                OR: [
                    { experience: { studentId: auth.payload.sub } },
                    { assignment: { studentId: auth.payload.sub } }
                ]
            };
        } else {
             return apiError("Missing filter: experienceId, assignmentId or studentId", 400);
        }

        const entries = await prisma.journalEntry.findMany({
            where: whereClause,
            orderBy: { date: "desc" },
            include: {
                experience: { select: { title: true } },
                assignment: { select: { title: true } }
            }
        });

        return apiSuccess(entries);
    } catch (err) {
        console.error("[journal GET]", err);
        return apiError("Erreur serveur", 500);
    }
}

// POST /api/journal — Ajouter une entrée au journal
export async function POST(request: NextRequest) {
    const auth = await requireAuth(request, ["STUDENT", "TEACHER"]);
    if ("status" in auth) return auth;

    try {
        const { content, proofs, links, experienceId, assignmentId, date } = await request.json();

        if (!content) {
            return apiError("Content is required", 400);
        }

        if (!experienceId && !assignmentId) {
            return apiError("experienceId or assignmentId is required", 400);
        }

        const entry = await prisma.journalEntry.create({
            data: {
                content,
                proofs: proofs || [],
                links: links || [],
                experienceId,
                assignmentId,
                date: date ? new Date(date) : new Date(),
            },
        });

        return apiSuccess(entry);
    } catch (err) {
        console.error("[journal POST]", err);
        return apiError("Erreur serveur", 500);
    }
}

// PATCH /api/journal — Ajouter un commentaire formateur ou valider une entrée
export async function PATCH(request: NextRequest) {
    const auth = await requireAuth(request, ["TEACHER"]);
    if ("status" in auth) return auth;

    try {
        const { id, teacherComment, isValidated } = await request.json();

        if (!id) {
            return apiError("ID is required", 400);
        }

        const entry = await prisma.journalEntry.update({
            where: { id },
            data: {
                ...(teacherComment !== undefined ? { teacherComment } : {}),
                ...(isValidated !== undefined ? { isValidated } : {}),
            },
            include: {
                assignment: true,
                experience: true
            }
        });

        // Trigger Notification for Student
        const studentId = entry.assignment?.studentId || entry.experience?.studentId;
        if (studentId) {
            await prisma.notification.create({
                data: {
                    userId: studentId,
                    title: isValidated ? "Action validée ! 🎉" : "Nouveau feedback formateur",
                    message: teacherComment ? `Votre formateur a laissé un commentaire : "${teacherComment.substring(0, 50)}..."` : "Votre action a été mise à jour par votre formateur.",
                    type: isValidated ? "VALIDATION" : "FEEDBACK"
                }
            });
        }

        return apiSuccess(entry);
    } catch (err) {
        console.error("[journal PATCH]", err);
        return apiError("Erreur serveur", 500);
    }
}
