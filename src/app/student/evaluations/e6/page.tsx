"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, GraduationCap, Download, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import E6_DATA from "../../../../../prisma/referentiel_e6.json";

type StudentEvaluation = {
    id: string;
    examType: "E4" | "E6";
    evaluationKind: "FORMATIVE" | "PREPARATOIRE";
    isValidated: boolean;
    validatedAt?: string | null;
    date: string;
    situation: string;
    globalComment?: string | null;
};

type ApiStudentEvaluation = Omit<StudentEvaluation, "evaluationKind"> & {
    evaluationKind: StudentEvaluation["evaluationKind"] | "CCF";
};

type EvaluationResponse = {
    evaluations?: ApiStudentEvaluation[];
    certifications?: {
        E4?: {
            isValidated: boolean;
            validatedAt?: string | null;
        };
        E6?: {
            isValidated: boolean;
            validatedAt?: string | null;
        };
    };
};

type StudentProfileData = {
    firstName: string;
    lastName: string;
    classCode?: string;
    name?: string;
};

type StudentProfileResponse = {
    student?: StudentProfileData;
};

type ReferentialChild = { description: string };
type ReferentialBlock = { code: string; children?: ReferentialChild[] };
type EvaluationPhase = "DIAGNOSTIC" | "FORMATIVE" | "PREPARATOIRE";

type EvaluationDetail = StudentEvaluation & {
    phase: EvaluationPhase;
    plainComment: string | null;
    gradeDetails: Array<{ criterionId: string; criterionLabel: string; score: number }>;
    averageScore: number | null;
};

function parseEvaluationGlobalComment(
    rawValue: string | null | undefined,
    criterionMap: Record<string, string>
): Pick<EvaluationDetail, "plainComment" | "gradeDetails" | "averageScore"> {
    const raw = (rawValue || "").trim();
    if (!raw) {
        return { plainComment: null, gradeDetails: [], averageScore: null };
    }

    try {
        const parsed = JSON.parse(raw) as { grades?: Record<string, unknown> };
        const rawGrades = parsed?.grades;
        if (!rawGrades || typeof rawGrades !== "object" || Array.isArray(rawGrades)) {
            return { plainComment: raw, gradeDetails: [], averageScore: null };
        }

        const gradeDetails = Object.entries(rawGrades)
            .map(([criterionId, value]) => {
                const score = Number(value);
                if (!Number.isFinite(score)) return null;

                return {
                    criterionId,
                    criterionLabel: criterionMap[criterionId] || criterionId,
                    score,
                };
            })
            .filter((item): item is { criterionId: string; criterionLabel: string; score: number } => Boolean(item))
            .sort((a, b) => b.score - a.score || a.criterionLabel.localeCompare(b.criterionLabel, "fr-FR"));

        const averageScore =
            gradeDetails.length > 0
                ? gradeDetails.reduce((sum, item) => sum + item.score, 0) / gradeDetails.length
                : null;

        return { plainComment: null, gradeDetails, averageScore };
    } catch {
        return { plainComment: raw, gradeDetails: [], averageScore: null };
    }
}

function normalizeForMatch(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function getEvaluationPhase(evaluation: StudentEvaluation): EvaluationPhase {
    if (evaluation.evaluationKind === "PREPARATOIRE") return "PREPARATOIRE";
    const normalizedSituation = normalizeForMatch(evaluation.situation || "");
    if (normalizedSituation.includes("diagnostic") || normalizedSituation.includes("positionnement")) {
        return "DIAGNOSTIC";
    }
    return "FORMATIVE";
}

function getEvaluationKindMeta(phase: EvaluationPhase) {
    if (phase === "DIAGNOSTIC") {
        return {
            label: "Diagnostic",
            badgeClass: "bg-sky-50 text-sky-700 border border-sky-100",
        };
    }
    if (phase === "FORMATIVE") {
        return {
            label: "Formative",
            badgeClass: "bg-blue-50 text-blue-700 border border-blue-100",
        };
    }

    return {
        label: "Préparatoire",
        badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    };
}

export default function StudentE6Page() {
    const [loading, setLoading] = useState(true);
    const [visibleEvaluations, setVisibleEvaluations] = useState<StudentEvaluation[]>([]);
    const [certification, setCertification] = useState<{
        isValidated: boolean;
        validatedAt?: string | null;
    } | null>(null);
    const [studentData, setStudentData] = useState<StudentProfileData | null>(null);
    const [expandedEvaluationId, setExpandedEvaluationId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const resEval = await apiFetch<EvaluationResponse>("/api/student/evaluations");
            if (resEval.data) {
                setVisibleEvaluations(
                    (resEval.data.evaluations || []).filter(
                        (e): e is StudentEvaluation => e.examType === "E6" && e.evaluationKind !== "CCF"
                    )
                );
                setCertification(resEval.data.certifications?.E6 || null);
            }

            const resProfile = await apiFetch<StudentProfileResponse>("/api/student/profile");
            if (resProfile.data?.student) setStudentData(resProfile.data.student);

            setLoading(false);
        };
        fetchData();
    }, []);

    const criterionMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const block of E6_DATA as ReferentialBlock[]) {
            (block.children || []).forEach((child, idx) => {
                map[`${block.code}_${idx}`] = child.description;
            });
        }
        return map;
    }, []);

    const detailedEvaluations = useMemo<EvaluationDetail[]>(
        () => {
            const parsed = [...visibleEvaluations]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((evaluation) => ({
                    ...evaluation,
                    phase: getEvaluationPhase(evaluation),
                    ...parseEvaluationGlobalComment(evaluation.globalComment, criterionMap),
                }));

            const hasDiagnostic = parsed.some((evaluation) => evaluation.phase === "DIAGNOSTIC");
            if (!hasDiagnostic) {
                const lastFormativeIndex = [...parsed]
                    .map((evaluation, idx) => ({ phase: evaluation.phase, idx }))
                    .filter((item) => item.phase === "FORMATIVE")
                    .map((item) => item.idx)
                    .pop();

                if (lastFormativeIndex !== undefined) {
                    parsed[lastFormativeIndex] = {
                        ...parsed[lastFormativeIndex],
                        phase: "DIAGNOSTIC",
                    };
                }
            }

            return parsed;
        },
        [visibleEvaluations, criterionMap]
    );

    const evaluationsByPhase = useMemo<Record<EvaluationPhase, EvaluationDetail[]>>(
        () => ({
            DIAGNOSTIC: detailedEvaluations.filter((evaluation) => evaluation.phase === "DIAGNOSTIC"),
            FORMATIVE: detailedEvaluations.filter((evaluation) => evaluation.phase === "FORMATIVE"),
            PREPARATOIRE: detailedEvaluations.filter((evaluation) => evaluation.phase === "PREPARATOIRE"),
        }),
        [detailedEvaluations]
    );

    const latestDiagnostic = evaluationsByPhase.DIAGNOSTIC[0] || null;
    const latestPreparatoire = evaluationsByPhase.PREPARATOIRE[0] || null;

    const evaluationRows: Array<{
        phase: EvaluationPhase;
        title: string;
        emptyLabel: string;
    }> = [
        {
            phase: "DIAGNOSTIC",
            title: "Positionnement Initial",
            emptyLabel: "Aucune évaluation diagnostique",
        },
        {
            phase: "FORMATIVE",
            title: "Évaluation Formative",
            emptyLabel: "Aucune évaluation formative",
        },
        {
            phase: "PREPARATOIRE",
            title: "Simulation d'Épreuve",
            emptyLabel: "Aucune évaluation préparatoire",
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        Épreuve <span className="text-indigo-600">E6</span>
                    </h1>
                    <p className="text-slate-500 font-bold mt-2">Relation Client et Animation de Réseaux</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                        <GraduationCap size={16} /> CCF - Contrôle en Cours de Formation
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <div className={cn(
                    "p-6 rounded-[24px] border flex items-center justify-between gap-4 transition-all",
                    certification?.isValidated
                        ? "bg-emerald-50 border-emerald-100 text-emerald-900"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            certification?.isValidated ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-slate-200 text-slate-400"
                        )}>
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">
                                Certification Numérique
                            </div>
                            <div className="font-black text-lg">
                                {certification?.isValidated ? "Dossier Validé" : "En attente de validation"}
                            </div>
                        </div>
                    </div>
                    {certification?.isValidated && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-tighter text-emerald-700 border border-emerald-200">
                            LE {certification.validatedAt ? new Date(certification.validatedAt).toLocaleDateString() : "N/A"}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between gap-6">
                    <div>
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Suivi Pédagogique</div>
                        <div className="font-bold text-slate-800">Mon Dossier de Progression E6</div>
                    </div>
                    <button
                        onClick={async () => {
                            if (!studentData) return;
                            const { DOCXService } = await import("@/lib/docx-service");
                            DOCXService.generateProPassport(studentData, []);
                        }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Download size={18} /> Télécharger mon suivi
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Evaluations Intermédiaires E6</h2>
                    <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                        Suivi Pédagogique (Diagnostic & Formatif)
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black">D</div>
                            <h3 className="font-bold text-slate-800 text-lg">Positionnement Initial</h3>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                            {latestDiagnostic
                                ? `Dernier diagnostic: ${new Date(latestDiagnostic.date).toLocaleDateString("fr-FR")}`
                                : "Aucune évaluation diagnostique E6 enregistrée pour le moment."}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all ring-2 ring-indigo-50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black">P</div>
                            <h3 className="font-bold text-slate-800 text-lg">Évaluation Préparatoire</h3>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                            {latestPreparatoire
                                ? `Dernière préparatoire: ${new Date(latestPreparatoire.date).toLocaleDateString("fr-FR")}`
                                : "Aucune évaluation préparatoire E6 enregistrée pour le moment."}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Liste de mes évaluations E6</h3>
                    {evaluationRows.map((row) => {
                        const kindMeta = getEvaluationKindMeta(row.phase);
                        const phaseEvaluations = evaluationsByPhase[row.phase];

                        return (
                            <div key={row.phase} className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                kindMeta.badgeClass
                                            )}
                                        >
                                            {kindMeta.label}
                                        </span>
                                        <span className="text-xs text-slate-500 font-bold">{row.title}</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-bold">
                                        {phaseEvaluations.length} évaluation{phaseEvaluations.length > 1 ? "s" : ""}
                                    </span>
                                </div>

                                {phaseEvaluations.length === 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-sm">
                                        <p className="text-sm font-bold text-slate-800">{row.emptyLabel} pour le moment.</p>
                                        <p className="text-xs text-slate-500 font-medium">Date: non réalisée</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {phaseEvaluations.map((evaluation) => {
                                            const isExpanded = expandedEvaluationId === evaluation.id;
                                            return (
                                                <div key={evaluation.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-500 font-bold">
                                                                {new Date(evaluation.date).toLocaleDateString("fr-FR")}
                                                            </span>
                                                        </div>

                                                        {evaluation.isValidated && (
                                                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                Validée
                                                            </span>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedEvaluationId((prev) => (prev === evaluation.id ? null : evaluation.id))}
                                                            className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors"
                                                        >
                                                            {isExpanded ? "Masquer détails" : "Voir détails"}
                                                        </button>
                                                    </div>

                                                    <p className="text-sm font-bold text-slate-800">{evaluation.situation}</p>

                                                    {isExpanded && evaluation.plainComment && (
                                                        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                                            {evaluation.plainComment}
                                                        </p>
                                                    )}

                                                    {isExpanded && evaluation.gradeDetails.length > 0 && (
                                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                                                    {evaluation.gradeDetails.length} critères notés
                                                                </span>
                                                                {evaluation.averageScore !== null && (
                                                                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                                                                        Moyenne {evaluation.averageScore.toFixed(2)}/4
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                {evaluation.gradeDetails.slice(0, 6).map((item) => (
                                                                    <div key={item.criterionId} className="flex items-start justify-between gap-3 text-xs">
                                                                        <span className="text-slate-700">{item.criterionLabel}</span>
                                                                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-black">
                                                                            {item.score}/4
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                {evaluation.gradeDetails.length > 6 && (
                                                                    <p className="text-[11px] text-slate-400 font-bold">
                                                                        +{evaluation.gradeDetails.length - 6} autres critères
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 bg-slate-900 rounded-[28px] text-white flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400">
                        <ShieldCheck size={20} />
                    </div>
                    <p className="text-xs font-medium text-slate-300">
                        La grille officielle E6 est réservée aux évaluateurs.
                    </p>
                </div>
            </div>
        </div>
    );
}
