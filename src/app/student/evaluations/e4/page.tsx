"use client";

import { useState, useEffect } from "react";
import { Loader2, GraduationCap, Download, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type StudentEvaluation = {
    examType: "E4" | "E6";
    evaluationKind: "FORMATIVE" | "PREPARATOIRE";
    isValidated: boolean;
    validatedAt?: string | null;
    date: string;
    situation: string;
    globalComment?: string | null;
};

type EvaluationResponse = {
    evaluations?: StudentEvaluation[];
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

export default function StudentE4Page() {
    const [loading, setLoading] = useState(true);
    const [visibleEvaluations, setVisibleEvaluations] = useState<StudentEvaluation[]>([]);
    const [certification, setCertification] = useState<{
        isValidated: boolean;
        validatedAt?: string | null;
    } | null>(null);
    const [studentData, setStudentData] = useState<StudentProfileData | null>(null);

    useEffect(() => {
        const fetchGrades = async () => {
            // Fetch Evaluation Status
            const resEval = await apiFetch<EvaluationResponse>("/api/student/evaluations");
            if (resEval.data) {
                setVisibleEvaluations(
                    (resEval.data.evaluations || []).filter((e) => e.examType === "E4")
                );
                setCertification(resEval.data.certifications?.E4 || null);
            }

            // Fetch Student Name for PDF
            const resProfile = await apiFetch<StudentProfileResponse>("/api/student/profile");
            if (resProfile.data?.student) setStudentData(resProfile.data.student);

            setLoading(false);
        };
        fetchGrades();
    }, []);

    const latestFormative = visibleEvaluations
        .filter((evaluation) => evaluation.evaluationKind === "FORMATIVE")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;

    const latestPreparatoire = visibleEvaluations
        .filter((evaluation) => evaluation.evaluationKind === "PREPARATOIRE")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;

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
                        Épreuve <span className="text-indigo-600">E4</span>
                    </h1>
                    <p className="text-slate-500 font-bold mt-2">Relation Client et Négociation-Vente</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                        <GraduationCap size={16} /> CCF - Contrôle en Cours de Formation
                    </div>
                </div>
            </div>

            {/* Export & Status Section */}
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
                        <div className="font-bold text-slate-800">Mon Dossier de Progression</div>
                    </div>
                    <button 
                        onClick={async () => {
                            if (!studentData) return;
                            // Pour l'étudiant, on génère un passeport de suivi (Passeport Pro)
                            // au lieu de la grille officielle de CCF.
                            const { DOCXService } = await import("@/lib/docx-service");
                            DOCXService.generateProPassport(
                                studentData,
                                []
                            );
                        }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Download size={18} /> Télécharger mon suivi
                    </button>
                </div>
            </div>

            {/* Section Évaluations Intermédiaires (Visible par l'étudiant) */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Evaluations Intermédiaires</h2>
                    <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                        Suivi Pédagogique (Diagnostic & Formatif)
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Évaluation Diagnostique */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black">D</div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Positionnement Initial</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">DIAGNOSTIC</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: latestFormative ? "65%" : "35%" }} />
                            </div>
                            <p className="text-xs text-slate-500 italic">
                                {latestFormative
                                    ? "Une evaluation formative E4 est disponible dans votre suivi pedagogique."
                                    : "Aucune evaluation formative E4 enregistree pour le moment."}
                            </p>
                        </div>
                    </div>

                    {/* Évaluation Préparatoire */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all ring-2 ring-indigo-50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black">P</div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Simulation d&apos;Epreuve</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">PREPARATOIRE</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: latestPreparatoire ? "70%" : "25%" }} />
                            </div>
                            <p className="text-xs text-slate-500 italic">
                                {latestPreparatoire
                                    ? "Une evaluation preparatoire E4 est disponible (entrainement avant CCF)."
                                    : "Aucune evaluation preparatoire E4 enregistree pour le moment."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Information de confidentialité */}
                <div className="p-6 bg-slate-900 rounded-[28px] text-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400">
                             <ShieldCheck size={20} />
                        </div>
                        <p className="text-xs font-medium text-slate-300 max-w-sm">
                            La grille officielle de certification (CCF) est réservée à l&apos;usage des évaluateurs. Seuls vos paliers de progression intermédiaires sont affichés ici.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
