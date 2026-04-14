import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/jwt";
import {
    buildEvaluationType,
    evaluationKindLabel,
    isExamType,
    normalizeEvaluationKind,
} from "@/lib/evaluation-types";

export async function POST(req: NextRequest) {
    try {
        const token = extractToken(req);
        if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        
        const payload = await verifyToken(token);
        if (!payload || (payload.role !== "TEACHER" && payload.role !== "ADMIN")) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const { studentId, type, isValidated, evaluationKind } = await req.json();

        if (!studentId || !type) {
            return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
        }

        const normalizedType = typeof type === "string" ? type.toUpperCase() : "";
        if (!isExamType(normalizedType)) {
            return NextResponse.json({ error: "Type d'épreuve invalide (E4/E6 attendu)" }, { status: 400 });
        }

        const normalizedKind = normalizeEvaluationKind(
            typeof evaluationKind === "string" ? evaluationKind : undefined
        );
        const evaluationType = buildEvaluationType(normalizedType, normalizedKind);

        const evaluation = await prisma.evaluation.findFirst({
            where: {
                studentId,
                OR: [
                    { type: evaluationType },
                    ...(normalizedKind === "CCF" ? [{ type: normalizedType }] : []),
                ],
            }
        });

        if (evaluation) {
            await prisma.evaluation.update({
                where: { id: evaluation.id },
                data: {
                    type: evaluationType,
                    situation: `Évaluation ${normalizedType} — ${evaluationKindLabel(normalizedKind)}`,
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
                    type: evaluationType,
                    situation: `Évaluation ${normalizedType} — ${evaluationKindLabel(normalizedKind)}`,
                    date: new Date(),
                    isValidated,
                    validatedAt: isValidated ? new Date() : null,
                }
            });
        }

        return NextResponse.json({ success: true, isValidated, evaluationKind: normalizedKind });
    } catch (error) {
        console.error("Erreur validation numérique:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
