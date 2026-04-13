"use client";

import { useEffect, useState, useCallback } from "react";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import { EvaluationTable } from "@/components/teacher/EvaluationTable";
import { apiGetStudents, type StudentWithProgress } from "@/lib/api-client";
import { E6_COMPETENCIES } from "@/data/competencies";
import { Loader2, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

const TOTAL_E6 = E6_COMPETENCIES.length;

export default function EvaluationsE6Page() {
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchStudents = useCallback(async () => {
    const { data, error } = await apiGetStudents();
    
    if (!error && data) {
      setStudents(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("ndrc_token");
    if (!token) {
      router.push("/teacher/login");
      return;
    }
    queueMicrotask(() => {
      void fetchStudents();
    });
  }, [fetchStudents, router]);


  const studentsWithE6Progress = students.map(s => {
    const e6Comps = s.competencies.filter(c => c.competencyId.startsWith("E6."));
    const evaluatedCount = e6Comps.filter(c => c.teacherStatus != null && c.teacherStatus >= 3).length;
    
    return {
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      classCode: s.classCode,
      progress: TOTAL_E6 > 0 ? Math.round((evaluatedCount / TOTAL_E6) * 100) : 0,
      evaluatedCount,
      totalCount: TOTAL_E6
    };
  });

  return (
    <TeacherLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Suivi <span className="text-purple-600">Épreuve E6</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Relation Client et Animation de Réseaux — Vue d&apos;ensemble de la classe.
            </p>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-purple-50 text-purple-700 rounded-2xl font-black text-sm border border-purple-100 shadow-sm">
            <GraduationCap size={20} />
            {TOTAL_E6} points de contrôle
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-purple-500" size={40} />
            <p className="text-slate-400 font-bold animate-pulse text-sm">Chargement de la classe...</p>
          </div>
        ) : (
          <EvaluationTable students={studentsWithE6Progress} type="E6" />
        )}
      </div>
    </TeacherLayout>
  );
}
