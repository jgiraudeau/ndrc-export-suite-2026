import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import {
  buildEvaluationType,
  evaluationKindLabel,
  isExamType,
  normalizeEvaluationKind,
  type EvaluationKind,
  type ExamType,
} from "@/lib/evaluation-types";

type StoredGradesPayload = {
  grades?: Record<string, number>;
};

function sanitizeGrades(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const output: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof key !== "string" || key.length === 0) continue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) continue;
    const rounded = Math.round(parsed);
    if (rounded < 1 || rounded > 4) continue;
    output[key] = rounded;
  }

  return output;
}

function parseStoredGrades(globalComment: string | null): Record<string, number> {
  if (!globalComment) return {};

  try {
    const parsed = JSON.parse(globalComment) as StoredGradesPayload;
    return sanitizeGrades(parsed.grades);
  } catch {
    return {};
  }
}

function buildSearchTypes(examType: ExamType, evaluationKind: EvaluationKind): string[] {
  const canonical = buildEvaluationType(examType, evaluationKind);
  if (evaluationKind === "CCF") {
    return [canonical, examType];
  }
  return [canonical];
}

function parseExamType(raw: string | null): ExamType | null {
  if (!raw) return null;
  const normalized = raw.toUpperCase();
  if (isExamType(normalized)) return normalized;
  return null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ["TEACHER", "ADMIN"]);
  if ("status" in auth) return auth;

  const studentId = request.nextUrl.searchParams.get("studentId");
  const examType = parseExamType(request.nextUrl.searchParams.get("examType"));
  const evaluationKind = normalizeEvaluationKind(
    request.nextUrl.searchParams.get("evaluationKind")
  );

  if (!studentId || !examType) {
    return apiError("Paramètres manquants: studentId et examType sont requis", 400);
  }

  const searchTypes = buildSearchTypes(examType, evaluationKind);
  const evaluation = await prisma.evaluation.findFirst({
    where: {
      studentId,
      type: { in: searchTypes },
    },
    orderBy: { date: "desc" },
  });

  return apiSuccess({
    studentId,
    examType,
    evaluationKind,
    grades: parseStoredGrades(evaluation?.globalComment ?? null),
    isValidated: evaluation?.isValidated ?? false,
    validatedAt: evaluation?.validatedAt?.toISOString() ?? null,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["TEACHER", "ADMIN"]);
  if ("status" in auth) return auth;

  const body = await request.json().catch(() => null);
  const studentId = typeof body?.studentId === "string" ? body.studentId : null;
  const examType = parseExamType(typeof body?.examType === "string" ? body.examType : null);
  const evaluationKind = normalizeEvaluationKind(
    typeof body?.evaluationKind === "string" ? body.evaluationKind : null
  );
  const grades = sanitizeGrades(body?.grades);

  if (!studentId || !examType) {
    return apiError("Paramètres manquants: studentId et examType sont requis", 400);
  }

  const searchTypes = buildSearchTypes(examType, evaluationKind);
  const evaluationType = buildEvaluationType(examType, evaluationKind);
  const encodedGrades = JSON.stringify({ grades });

  const existing = await prisma.evaluation.findFirst({
    where: {
      studentId,
      type: { in: searchTypes },
    },
    orderBy: { date: "desc" },
  });

  if (existing) {
    await prisma.evaluation.update({
      where: { id: existing.id },
      data: {
        type: evaluationType,
        evaluatorId: auth.payload.sub,
        date: new Date(),
        situation: `Évaluation ${examType} — ${evaluationKindLabel(evaluationKind)}`,
        globalComment: encodedGrades,
      },
    });
  } else {
    await prisma.evaluation.create({
      data: {
        studentId,
        evaluatorId: auth.payload.sub,
        type: evaluationType,
        situation: `Évaluation ${examType} — ${evaluationKindLabel(evaluationKind)}`,
        date: new Date(),
        globalComment: encodedGrades,
        isValidated: false,
      },
    });
  }

  return apiSuccess({
    success: true,
    studentId,
    examType,
    evaluationKind,
    gradesCount: Object.keys(grades).length,
  });
}
