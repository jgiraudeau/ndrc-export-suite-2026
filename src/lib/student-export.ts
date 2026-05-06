import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/lib/jwt";

export async function getStudentForRgpdExport(studentId: string, actor: JWTPayload) {
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            identifier: true,
            wpUrl: true,
            prestaUrl: true,
            consentGivenAt: true,
            createdAt: true,
            teacherId: true,
            class: {
                select: { id: true, code: true, name: true, createdAt: true },
            },
            teacher: {
                select: { id: true, name: true, email: true },
            },
            progress: {
                orderBy: { updatedAt: "desc" },
            },
            comments: {
                orderBy: { createdAt: "desc" },
                include: {
                    teacher: { select: { id: true, name: true, email: true } },
                },
            },
            evaluationsOfficial: {
                orderBy: { createdAt: "desc" },
                include: {
                    evaluator: { select: { id: true, name: true, email: true } },
                    session: true,
                    scores: {
                        include: { criterion: true },
                    },
                },
            },
            experiences: {
                orderBy: { createdAt: "desc" },
                include: {
                    journal: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
            missions: {
                orderBy: { assignedAt: "desc" },
                include: {
                    mission: true,
                    journal: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
            chatSessions: {
                orderBy: { createdAt: "desc" },
                include: {
                    messages: {
                        orderBy: { createdAt: "asc" },
                    },
                },
            },
        },
    });

    if (!student) return null;

    if (actor.role === "TEACHER" && student.teacherId !== actor.sub) return null;
    if (actor.role === "STUDENT" && student.id !== actor.sub) return null;

    const safeStudent = Object.fromEntries(
        Object.entries(student).filter(([key]) => key !== "teacherId")
    ) as Omit<typeof student, "teacherId">;

    return {
        exportedAt: new Date().toISOString(),
        exportedBy: {
            id: actor.sub,
            role: actor.role,
            name: actor.name,
        },
        formatVersion: 1,
        student: safeStudent,
    };
}

export function buildStudentExportFilename(student: { firstName: string; lastName: string; identifier: string }) {
    const base = `${student.lastName}-${student.firstName}-${student.identifier}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    return `export-rgpd-${base || "eleve"}.json`;
}
