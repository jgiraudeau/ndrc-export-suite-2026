"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Download, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type StudentEvaluation = {
    type: string;
    isValidated: boolean;
    validatedAt?: string | null;
};

type EvaluationResponse = {
    evaluations?: StudentEvaluation[];
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

export default function StudentE6Page() {
    const [loading, setLoading] = useState(true);
    const [evaluation, setEvaluation] = useState<StudentEvaluation | null>(null);
    const [studentData, setStudentData] = useState<StudentProfileData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Evaluation Status
            const resEval = await apiFetch<EvaluationResponse>("/api/student/evaluations");
            if (resEval.data?.evaluations) {
                const targetEval = resEval.data.evaluations.find((e) => e.type === "E6") || null;
                setEvaluation(targetEval);
            }

            // Fetch Student Name for PDF
            const resProfile = await apiFetch<StudentProfileResponse>("/api/student/profile");
            if (resProfile.data?.student) setStudentData(resProfile.data.student);

            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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

            {/* Export & Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <div className={cn(
                    "p-6 rounded-[24px] border flex items-center justify-between gap-4 transition-all",
                    evaluation?.isValidated 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-900" 
                        : "bg-slate-50 border-slate-200 text-slate-500"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            evaluation?.isValidated ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-slate-200 text-slate-400"
                        )}>
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">
                                Certification Numérique
                            </div>
                            <div className="font-black text-lg">
                                {evaluation?.isValidated ? "Dossier Validé" : "En attente de validation"}
                            </div>
                        </div>
                    </div>
                    {evaluation?.isValidated && (
                         <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-tighter text-emerald-700 border border-emerald-200">
                            LE {evaluation.validatedAt ? new Date(evaluation.validatedAt).toLocaleDateString() : "N/A"}
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
                        <p className="text-xs text-slate-500 italic">Diagnostic des capacités d&apos;animation de réseau effectué.</p>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all ring-2 ring-indigo-50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black">F</div>
                            <h3 className="font-bold text-slate-800 text-lg">Évaluation Formative</h3>
                        </div>
                        <p className="text-xs text-slate-500 italic">En attente des premiers retours sur l&apos;implantation en réseau distributeur.</p>
                    </div>
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
