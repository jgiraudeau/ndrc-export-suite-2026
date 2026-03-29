import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
    try {
        const token = extractToken(req);
        if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "STUDENT") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const evaluations = await prisma.evaluation.findMany({
            where: { studentId: payload.sub },
            include: {
                evaluator: { select: { name: true } },
                scores: { 
                    include: { 
                        criterion: { 
                            include: { competency: true } 
                        } 
                    } 
                }
            }
        });

        return NextResponse.json({ evaluations });
    } catch (error) {
        console.error("Erreur récup evaluations student:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
