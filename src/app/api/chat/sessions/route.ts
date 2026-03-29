import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/jwt";

// GET /api/chat/sessions - Liste les sessions de l'étudiant connecté
export async function GET(req: NextRequest) {
    try {
        const token = extractToken(req);
        if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "STUDENT") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const sessions = await prisma.chatSession.findMany({
            where: { studentId: payload.sub },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { messages: true }
                }
            }
        });

        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Erreur listing sessions:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// POST /api/chat/sessions - Crée une nouvelle session
export async function POST(req: NextRequest) {
    try {
        const token = extractToken(req);
        if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "STUDENT") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const { title } = await req.json();

        const session = await prisma.chatSession.create({
            data: {
                title: title || "Nouvelle conversation",
                studentId: payload.sub
            }
        });

        return NextResponse.json(session);
    } catch (error) {
        console.error("Erreur création session:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
