import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/jwt";
import { parseEvaluationType, type ExamType } from "@/lib/evaluation-types";

type StudentVisibleEvaluation = {
    id: string;
    examType: ExamType;
    evaluationKind: "FORMATIVE" | "PREPARATOIRE";
    isValidated: boolean;
    validatedAt?: string | null;
    date: string;
    situation: string;
    globalComment: string | null;
};

type CertificationSummary = {
    isValidated: boolean;
    validatedAt: string | null;
};

export async function GET(req: NextRequest) {
    try {
        const token = extractToken(req);
        if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "STUDENT") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const rawEvaluations = await prisma.evaluation.findMany({
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
            },
            orderBy: { date: "desc" },
        });

        const certifications: Record<ExamType, CertificationSummary> = {
            E4: { isValidated: false, validatedAt: null },
            E6: { isValidated: false, validatedAt: null },
        };

        const evaluations: StudentVisibleEvaluation[] = [];

        function buildGradesFromScores(
            scores: Array<{
                criterionId: string;
                score: number;
                criterion: { competency: { code: string } };
            }>
        ): string | null {
            const grades: Record<string, number> = {};
            for (const score of scores) {
                const key = score.criterion?.competency?.code || score.criterionId;
                if (!key) continue;
                const numeric = Number(score.score);
                if (!Number.isFinite(numeric)) continue;
                grades[key] = Math.round(numeric * 100) / 100;
            }
            if (Object.keys(grades).length === 0) return null;
            return JSON.stringify({ grades });
        }

        for (const evaluation of rawEvaluations) {
            const parsed = parseEvaluationType(evaluation.type);
            if (!parsed.examType || !parsed.evaluationKind) continue;

            if (parsed.evaluationKind === "CCF") {
                const current = certifications[parsed.examType];
                const currentDate = current.validatedAt ? new Date(current.validatedAt).getTime() : 0;
                const nextDate = evaluation.validatedAt ? evaluation.validatedAt.getTime() : 0;
                if (nextDate >= currentDate) {
                    certifications[parsed.examType] = {
                        isValidated: Boolean(evaluation.isValidated),
                        validatedAt: evaluation.validatedAt?.toISOString() ?? null,
                    };
                }
                // Les évaluations certificatives (CCF) sont confidentielles côté élève.
                continue;
            }

            evaluations.push({
                id: evaluation.id,
                examType: parsed.examType,
                evaluationKind: parsed.evaluationKind,
                isValidated: Boolean(evaluation.isValidated),
                validatedAt: evaluation.validatedAt?.toISOString() ?? null,
                date: evaluation.date.toISOString(),
                situation: evaluation.situation,
                globalComment: evaluation.globalComment ?? buildGradesFromScores(evaluation.scores),
            });
        }

        return NextResponse.json({ evaluations, certifications });
    } catch (error) {
        console.error("Erreur récup evaluations student:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
