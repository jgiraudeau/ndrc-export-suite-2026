import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit-log";
import {
    buildEvaluationType,
    evaluationKindLabel,
    isExamType,
    normalizeEvaluationKind,
} from "@/lib/evaluation-types";

export async function POST(req: NextRequest) {
    const auth = await requireAuth(req, ["TEACHER", "ADMIN"]);
    if ("status" in auth) return auth;

    try {
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

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, teacherId: true },
        });
        if (!student) {
            return NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });
        }
        if (auth.payload.role === "TEACHER" && student.teacherId !== auth.payload.sub) {
            return NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });
        }

        const evaluation = await prisma.evaluation.findFirst({
            where: {
                studentId,
                OR: [
                    { type: evaluationType },
                    ...(normalizedKind === "CCF" ? [{ type: normalizedType }] : []),
                ],
            }
        });

        let evaluationId = evaluation?.id;

        if (evaluation) {
            await prisma.evaluation.update({
                where: { id: evaluation.id },
                data: {
                    type: evaluationType,
                    situation: `Évaluation ${normalizedType} — ${evaluationKindLabel(normalizedKind)}`,
                    isValidated,
                    validatedAt: isValidated ? new Date() : null,
                    evaluatorId: auth.payload.sub
                }
            });
        } else {
            // Si elle n'existe pas encore (curieux mais possible), on la crée
            const createdEvaluation = await prisma.evaluation.create({
                data: {
                    studentId,
                    evaluatorId: auth.payload.sub,
                    type: evaluationType,
                    situation: `Évaluation ${normalizedType} — ${evaluationKindLabel(normalizedKind)}`,
                    date: new Date(),
                    isValidated,
                    validatedAt: isValidated ? new Date() : null,
                }
            });
            evaluationId = createdEvaluation.id;
        }

        await writeAuditLog({
            actor: auth.payload,
            action: isValidated ? "teacher.evaluation.validate" : "teacher.evaluation.unvalidate",
            targetType: "evaluation",
            targetId: evaluationId,
            metadata: {
                studentId,
                type: normalizedType,
                evaluationKind: normalizedKind,
            },
            request: req,
        });

        return NextResponse.json({ success: true, isValidated, evaluationKind: normalizedKind });
    } catch (error) {
        console.error("Erreur validation numérique:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
