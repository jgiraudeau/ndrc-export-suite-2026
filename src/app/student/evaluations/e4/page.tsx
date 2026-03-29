"use client";

import { useState, useEffect } from "react";
import { Loader2, GraduationCap } from "lucide-react";
import { ReferentialGrid } from "@/components/teacher/ReferentialGrid";
import E4_DATA from "../../../../../prisma/referentiel_e4.json";
import { apiGetProgress } from "@/lib/api-client";

export default function StudentE4Page() {
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchGrades = async () => {
            const { data, error } = await apiGetProgress();
            if (data) {
                const gradeMap: Record<string, number> = {};
                data.forEach(p => {
                    if (p.teacherStatus != null) {
                        gradeMap[p.competencyId] = p.teacherStatus;
                    }
                });
                setGrades(gradeMap);
            }
            setLoading(false);
        };
        fetchGrades();
    }, []);

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
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                    <GraduationCap size={16} /> CCF - Contrôle en Cours de Formation
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[24px] flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                    <GraduationCap size={20} />
                </div>
                <div className="space-y-1">
                    <p className="text-amber-800 font-black text-sm uppercase tracking-tight">Note aux étudiants</p>
                    <p className="text-amber-700/80 text-sm font-medium leading-relaxed">
                        Cette grille affiche les évaluations validées par vos formateurs. Les niveaux de maîtrise (De Novice à Expert) sont basés sur les critères officiels du référentiel BTS NDRC.
                    </p>
                </div>
            </div>

            <ReferentialGrid 
                studentId="me" 
                referential={E4_DATA as any} 
                type="E4"
                initialGrades={grades}
                readOnly={true}
            />
        </div>
    );
}
