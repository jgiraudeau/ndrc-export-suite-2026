"use client";

import { useState, useEffect } from "react";
import { Loader2, GraduationCap, Download, ShieldCheck } from "lucide-react";
import { ReferentialGrid } from "@/components/teacher/ReferentialGrid";
import E6_DATA from "../../../../../prisma/referentiel_e6.json";
import { apiGetProgress, apiFetch } from "@/lib/api-client";
import { PDFExportService } from "@/lib/exports/student-export";
import { cn } from "@/lib/utils";

export default function StudentE6Page() {
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState<Record<string, number>>({});
    const [evaluation, setEvaluation] = useState<any>(null);
    const [studentData, setStudentData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await apiGetProgress();
            if (data) {
                const gradeMap: Record<string, number> = {};
                data.forEach(p => {
                    if (p.teacherStatus != null) {
                        gradeMap[p.competencyId] = p.teacherStatus;
                    }
                });
                setGrades(gradeMap);
            }

            // Fetch Evaluation Status
            const resEval = await apiFetch<any>("/api/student/evaluations");
            if (resEval.data && resEval.data.evaluations) {
                const targetEval = resEval.data.evaluations.find((e: any) => e.type === "E6");
                setEvaluation(targetEval);
            }

            // Fetch Student Name for PDF
            const resProfile = await apiFetch<any>("/api/student/profile");
            if (resProfile.data) setStudentData(resProfile.data.student);

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
                            LE {new Date(evaluation.validatedAt).toLocaleDateString()}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between gap-6">
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Documents Officiels</div>
                        <div className="font-bold text-slate-800">Exportation du Dossier E6</div>
                    </div>
                    <button 
                        onClick={() => {
                            if (!studentData) return;
                            const GRADE_LABELS: Record<number, string> = { 1: "Très insuffisant", 2: "Insuffisant", 3: "Satisfaisant", 4: "Très satisfaisant" };
                            PDFExportService.generateOfficialEvaluation({
                                studentName: studentData.name,
                                evaluationType: "E6",
                                teacherName: evaluation?.evaluator?.name || "Formateur NDRC",
                                date: new Date().toISOString(),
                                isValidated: evaluation?.isValidated || false,
                                validatedAt: evaluation?.validatedAt,
                                grades: (E6_DATA as any).flatMap((comp: any) => 
                                    comp.children.map((child: any, idx: number) => {
                                        const grade = grades[`${comp.code}_${idx}`];
                                        return {
                                            code: comp.code,
                                            label: child.description,
                                            scoreLabel: grade ? GRADE_LABELS[grade] : "Non évalué"
                                        };
                                    })
                                )
                            });
                        }}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Download size={18} /> Télécharger maintenant
                    </button>
                </div>
            </div>

            <ReferentialGrid 
                studentId="me" 
                referential={E6_DATA as any} 
                type="E6"
                initialGrades={grades}
                readOnly={true}
                isValidated={evaluation?.isValidated}
                validatedAt={evaluation?.validatedAt}
            />
        </div>
    );
}
