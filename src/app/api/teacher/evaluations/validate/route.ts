import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
    try {
        const token = extractToken(req);
        if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        
        const payload = await verifyToken(token);
        if (!payload || (payload.role !== "TEACHER" && payload.role !== "ADMIN")) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const { studentId, type, isValidated } = await req.json();

        if (!studentId || !type) {
            return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
        }

        // 1. Trouver ou créer l'évaluation de ce type pour cet étudiant
        // On cherche une évaluation de type 'official' pour le bloc concerné (E4 ou E6)
        const evaluation = await prisma.evaluation.findFirst({
            where: {
                studentId,
                type: type.toUpperCase(), // ex: "E4" ou "E6"
            }
        });

        if (evaluation) {
            await prisma.evaluation.update({
                where: { id: evaluation.id },
                data: {
                    isValidated,
                    validatedAt: isValidated ? new Date() : null,
                    evaluatorId: payload.sub
                }
            });
        } else {
            // Si elle n'existe pas encore (curieux mais possible), on la crée
            await prisma.evaluation.create({
                data: {
                    studentId,
                    evaluatorId: payload.sub,
                    type: type.toUpperCase(),
                    situation: "Dossier Officiel",
                    date: new Date(),
                    isValidated,
                    validatedAt: isValidated ? new Date() : null,
                }
            });
        }

        return NextResponse.json({ success: true, isValidated });
    } catch (error) {
        console.error("Erreur validation numérique:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
