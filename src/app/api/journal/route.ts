import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
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

        let whereClause: Prisma.JournalEntryWhereInput = {};
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
                assignment: { select: { mission: { select: { title: true } } } }
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
        const body = (await request.json()) as {
            content?: unknown;
            proofs?: unknown;
            links?: unknown;
            experienceId?: unknown;
            assignmentId?: unknown;
            date?: unknown;
        };
        const content = typeof body.content === "string" ? body.content.trim() : "";
        const proofs =
            Array.isArray(body.proofs) && body.proofs.every((p) => typeof p === "string")
                ? body.proofs
                : [];
        const links =
            Array.isArray(body.links) && body.links.every((l) => typeof l === "string")
                ? body.links
                : [];
        const experienceId = typeof body.experienceId === "string" ? body.experienceId : null;
        const assignmentId = typeof body.assignmentId === "string" ? body.assignmentId : null;
        const parsedDate = body.date !== undefined ? new Date(String(body.date)) : new Date();
        const date = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

        if (!content) {
            return apiError("Content is required", 400);
        }

        if (!experienceId && !assignmentId) {
            return apiError("experienceId or assignmentId is required", 400);
        }

        const entry = await prisma.journalEntry.create({
            data: {
                content,
                proofs,
                links,
                experienceId,
                assignmentId,
                date,
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
        const body = (await request.json()) as {
            id?: unknown;
            teacherComment?: unknown;
            isValidated?: unknown;
        };
        const id = typeof body.id === "string" ? body.id : "";
        const teacherComment =
            body.teacherComment === undefined
                ? undefined
                : typeof body.teacherComment === "string"
                  ? body.teacherComment
                  : null;
        const isValidated =
            body.isValidated === undefined
                ? undefined
                : typeof body.isValidated === "boolean"
                  ? body.isValidated
                  : undefined;

        if (!id) {
            return apiError("ID is required", 400);
        }

        const updateData: Prisma.JournalEntryUpdateInput = {};
        if (teacherComment !== undefined) updateData.teacherComment = teacherComment;
        if (isValidated !== undefined) updateData.isValidated = isValidated;

        if (Object.keys(updateData).length === 0) {
            return apiError("Aucune donnée à mettre à jour", 400);
        }

        const entry = await prisma.journalEntry.update({
            where: { id },
            data: updateData,
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
