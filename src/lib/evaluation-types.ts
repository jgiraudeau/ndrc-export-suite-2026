export type ExamType = "E4" | "E6";

export type EvaluationKind = "FORMATIVE" | "PREPARATOIRE" | "CCF";

export type ParsedEvaluationType = {
  examType: ExamType | null;
  evaluationKind: EvaluationKind | null;
};

const EVALUATION_KINDS: EvaluationKind[] = ["FORMATIVE", "PREPARATOIRE", "CCF"];

export function isExamType(value: string | null | undefined): value is ExamType {
  return value === "E4" || value === "E6";
}

export function normalizeEvaluationKind(value: string | null | undefined): EvaluationKind {
  const normalized = value?.toUpperCase();
  if (normalized && EVALUATION_KINDS.includes(normalized as EvaluationKind)) {
    return normalized as EvaluationKind;
  }
  return "CCF";
}

export function buildEvaluationType(examType: ExamType, evaluationKind: EvaluationKind): string {
  return `${examType}_${evaluationKind}`;
}

export function parseEvaluationType(rawType: string | null | undefined): ParsedEvaluationType {
  if (!rawType) return { examType: null, evaluationKind: null };

  const normalized = rawType.toUpperCase();

  if (isExamType(normalized)) {
    return { examType: normalized, evaluationKind: "CCF" };
  }

  const [examTypeCandidate, evaluationKindCandidate] = normalized.split("_");
  if (!isExamType(examTypeCandidate)) {
    return { examType: null, evaluationKind: null };
  }

  const evaluationKind = normalizeEvaluationKind(evaluationKindCandidate);
  return { examType: examTypeCandidate, evaluationKind };
}

export function evaluationKindLabel(kind: EvaluationKind): string {
  switch (kind) {
    case "FORMATIVE":
      return "Formative";
    case "PREPARATOIRE":
      return "Preparatoire";
    case "CCF":
      return "Certificative (CCF)";
    default:
      return kind;
  }
}
