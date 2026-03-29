import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
    try {
        const token = extractToken(req);
        if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        
        const payload = await verifyToken(token);
        if (!payload || (payload.role !== "TEACHER" && payload.role !== "ADMIN")) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const teacherId = payload.sub;

        // 1. Statistiques générales
        const studentsCount = await prisma.student.count({ where: { teacherId } });
        
        const activeSessions = await prisma.chatSession.count({
            where: { student: { teacherId } }
        });

        const totalMessages = await prisma.chatMessage.count({
            where: { session: { student: { teacherId } } }
        });

        // 2. Dernières questions posées (Anonymes pour la démo, mais on a l'info)
        const latestQuestions = await prisma.chatMessage.findMany({
            where: { 
                role: 'user',
                session: { student: { teacherId } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                session: {
                    select: {
                        student: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                }
            }
        });

        // 3. Thématiques probables (basé sur les titres des sessions)
        const sessions = await prisma.chatSession.findMany({
            where: { student: { teacherId } },
            select: { title: true },
            take: 100
        });

        return NextResponse.json({
            stats: {
                studentsCount,
                activeSessions,
                totalMessages,
            },
            latestQuestions: latestQuestions.map(q => ({
                id: q.id,
                content: q.content,
                date: q.createdAt,
                student: `${q.session.student.firstName} ${q.session.student.lastName}`
            }))
        });
    } catch (error) {
        console.error("Erreur stats IA:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
