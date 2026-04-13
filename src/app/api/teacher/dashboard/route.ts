import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/jwt";

export async function GET(req: Request) {
    try {
        const token = extractToken(req);
        if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "TEACHER") {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const teacherId = payload.sub;

        // 1. Stats de base
        const studentCount = await prisma.student.count({ where: { teacherId } });
        const classCount = await prisma.class.count({ where: { teacherId } });
        
        // On considère comme "à évaluer" les progrès étudiants (acquired: true) sans teacherStatus
        const pendingEvals = await prisma.progress.count({ 
            where: { 
                student: { teacherId },
                acquired: true,
                teacherStatus: null
            } 
        });

        // 2. Progression moyenne
        const TOTAL_COMPETENCIES = 40;
        const allProgress = await prisma.progress.count({
            where: {
                student: { teacherId },
                acquired: true
            }
        });
        
        const avgProgress = studentCount > 0 
            ? Math.round((allProgress / (studentCount * TOTAL_COMPETENCIES)) * 100) 
            : 0;

        // 3. Activités récentes
        const recentAssignments = await prisma.missionAssignment.findMany({
            where: { teacherId },
            include: {
                student: { select: { firstName: true, lastName: true } },
                mission: { select: { title: true } }
            },
            orderBy: { assignedAt: "desc" },
            take: 3
        });

        const recentLogs = await prisma.journalEntry.findMany({
            where: {
                OR: [
                    { assignment: { teacherId } },
                    { experience: { student: { teacherId } } }
                ]
            },
            include: {
                assignment: { include: { mission: { select: { title: true } } } },
                experience: { select: { title: true } }
            },
            orderBy: { date: "desc" },
            take: 3
        });

        const activities = [
            ...recentAssignments.map(a => ({
                id: a.id,
                type: "assignment",
                title: `Mission ${a.mission.title.substring(0, 15)}... (${a.student.firstName})`,
                date: a.assignedAt,
                status: "Assigné"
            })),
            ...recentLogs.map((l) => ({
                id: l.id,
                type: "log",
                title: `${l.content.substring(0, 20)}... (${l.assignment?.mission?.title || l.experience?.title || "Projet"})`,
                date: l.date,
                status: "Nouveau"
            }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

        return NextResponse.json({
            success: true,
            data: {
                students: studentCount,
                classes: classCount,
                avgProgress: Math.min(avgProgress, 100),
                pendingEvals,
                activities
            }
        });
    } catch (err) {
        console.error("Dashboard API Error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
